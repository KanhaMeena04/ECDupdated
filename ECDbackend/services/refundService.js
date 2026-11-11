
const Order = require('../models/Order');
const WalletTransaction = require('../models/WalletTransaction');
const RefundRequest = require('../models/RefundRequest');
const SettlementLedger = require('../models/SettlementLedger');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AdminSetting = require('../models/AdminSetting');
const { isCOD } = require('../utils/paymentHelpers');

const DEFAULT_REASON_RULES = {
  customer: { refundPercent: 100, preparingRefundPercent: 50, restaurantPayablePercent: 0, platformLossPercent: 100 },
  restaurant: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 },
  timeout: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 },
  rider_unavailable: { refundPercent: 100, restaurantPayablePercent: 50, platformLossPercent: 50 },
  food_unavailable: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 },
  technical: { refundPercent: 100, restaurantPayablePercent: 0, platformLossPercent: 100 }
};

function mapRuleKeyToLedgerReason(ruleKey = '') {
  switch (ruleKey) {
    case 'customer': return 'Customer';
    case 'restaurant': return 'Restaurant';
    case 'timeout': return 'Timeout';
    case 'rider_unavailable': return 'Rider unavailable';
    case 'food_unavailable': return 'Food unavailable';
    case 'technical': return 'Technical';
    default: return 'Other';
  }
}

function detectRuleKey(reason = '', initiatorRole = '', reasonRules = {}) {
  const normalizedReason = String(reason || '').trim().toLowerCase();
  const normalizedRole = String(initiatorRole || '').trim().toLowerCase();

  // Direct keyword classification
  if (normalizedReason.includes('out of stock') || normalizedReason.includes('unavailable') || normalizedReason.includes('food_unavailable') || normalizedReason.includes('sold out')) {
    if (normalizedReason.includes('rider')) return 'rider_unavailable';
    return 'food_unavailable';
  }
  if (normalizedReason.includes('rider') || normalizedRole === 'rider') return 'rider_unavailable';
  if (normalizedReason.includes('timeout') || normalizedReason.includes('auto-cancel') || normalizedReason.includes('expired') || normalizedRole === 'system') return 'timeout';
  if (normalizedReason.includes('technical') || normalizedReason.includes('payment_failure') || normalizedReason.includes('gateway')) return 'technical';
  if (normalizedReason.includes('restaurant') || normalizedRole === 'restaurant_owner' || normalizedRole === 'restaurant') return 'restaurant';
  if (normalizedReason.includes('customer') || normalizedRole === 'customer') return 'customer';

  if (reasonRules && typeof reasonRules === 'object' && !Array.isArray(reasonRules)) {
    const matchedKey = Object.keys(reasonRules).find((k) => normalizedReason.includes(k.toLowerCase()));
    if (matchedKey) return matchedKey;
  }
  return 'default';
}

function resolveRefundRule(refundConfig, reason = '', { initiatorRole = '', orderStatus = '' } = {}) {
  const rawRules = refundConfig?.reasonRules;
  let matched = null;
  let ruleKey = detectRuleKey(reason, initiatorRole, rawRules);

  if (Array.isArray(rawRules)) {
    const normalizedReason = String(reason || '').trim().toLowerCase();
    matched = rawRules.find((r) => {
      const k = String(r.reasonKey || '').trim().toLowerCase();
      const l = String(r.label || '').trim().toLowerCase();
      return (k && (normalizedReason.includes(k) || k === ruleKey)) || (l && normalizedReason.includes(l));
    });
    if (matched?.reasonKey) ruleKey = matched.reasonKey;
  } else if (rawRules && typeof rawRules === 'object') {
    matched = rawRules[ruleKey] || DEFAULT_REASON_RULES[ruleKey] || null;
  } else {
    matched = DEFAULT_REASON_RULES[ruleKey] || null;
  }

  let refundPercent = matched?.refundPercent !== undefined ? Number(matched.refundPercent) : 100;
  if (ruleKey === 'customer' && String(orderStatus || '').toLowerCase() === 'preparing') {
    if (matched?.preparingRefundPercent !== undefined) {
      refundPercent = Number(matched.preparingRefundPercent);
    } else if (refundPercent === 100) {
      refundPercent = 50;
    }
  }
  refundPercent = Math.max(0, Math.min(100, isNaN(refundPercent) ? 100 : refundPercent));

  const restaurantPayablePercent = Math.max(
    0,
    Math.min(100, matched?.restaurantPayablePercent !== undefined ? Number(matched.restaurantPayablePercent) : 0)
  );
  const platformLossPercent = Math.max(
    0,
    Math.min(
      100,
      matched?.platformLossPercent !== undefined
        ? Number(matched.platformLossPercent)
        : Math.max(0, 100 - restaurantPayablePercent)
    )
  );

  return {
    ruleMatched: ruleKey || 'default',
    ledgerReason: mapRuleKeyToLedgerReason(ruleKey),
    refundPercent,
    restaurantPayablePercent,
    platformLossPercent,
  };
}

async function applyRestaurantLiabilityToLedger(order, restaurantPayableShare, session = null) {
  if (!order || !(restaurantPayableShare > 0)) return;
  try {
    const q = SettlementLedger.findOne({ order: order._id, status: { $ne: 'PAID' } });
    if (session) q.session(session);
    const ledger = await q;
    if (ledger) {
      const delta = Number(restaurantPayableShare) - Number(ledger.refundDeduction || 0);
      if (delta > 0) {
        ledger.refundDeduction = Math.round((Number(ledger.refundDeduction || 0) + delta) * 100) / 100;
        ledger.netPayable = Math.max(0, Math.round((Number(ledger.netPayable || 0) - delta) * 100) / 100);
        await ledger.save(session ? { session } : undefined);
      }
    }
  } catch (_) {}
}

async function processRefund({
  orderId,
  order = null,
  reason,
  initiatedBy,
  initiatorRole = 'system',
  orderStatusBeforeCancel = '',
  customRefundAmount = null,
  forceWalletRefund = false,
  skipOrderSave = false,
  session = null
}) {
  try {
    if (!order) {
      const q = Order.findById(orderId);
      if (session) q.session(session);
      order = await q;
    }
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    if (order.refund && order.refund.status === 'completed') {
      return { success: false, error: 'Order already refunded' };
    }

    const totalAmount = Number(order.totalAmount || 0);
    const settings = await AdminSetting.getSettings().catch(() => null);
    const refundConfig = settings?.refundConfig || { mode: 'manual', autoRefundReasons: [], reasonRules: DEFAULT_REASON_RULES };
    const splitRule = resolveRefundRule(refundConfig, reason, {
      initiatorRole,
      orderStatus: orderStatusBeforeCancel || order.status
    });

    if (isCOD(order) && !(Number(customRefundAmount) > 0)) {
      return {
        success: true,
        message: 'COD order - no refund needed',
        refundAmount: 0,
        refundPercentage: 0,
        restaurantPayableShare: 0,
        platformLoss: 0,
        method: 'none',
        responsibilitySplit: splitRule
      };
    }

    const computedRefundAmount = customRefundAmount !== null && customRefundAmount !== undefined && Number(customRefundAmount) >= 0
      ? Math.round(Number(customRefundAmount) * 100) / 100
      : Math.max(0, Math.round(((totalAmount * splitRule.refundPercent) / 100) * 100) / 100);

    const restaurantPayableShare = computedRefundAmount > 0
      ? Math.round(((computedRefundAmount * splitRule.restaurantPayablePercent) / 100) * 100) / 100
      : 0;
    const platformLoss = computedRefundAmount > 0
      ? Math.max(0, Math.round((computedRefundAmount - restaurantPayableShare) * 100) / 100)
      : 0;

    let refundMethod = 'pending';
    let walletCredited = false;
    let creditedAmount = 0;

    const userQ = User.findById(order.customer);
    if (session) userQ.session(session);
    const user = await userQ;
    if (!user) {
      return { success: false, error: 'Customer not found' };
    }

    if (computedRefundAmount > 0) {
      const walletDedQ = WalletTransaction.findOne({
        user: order.customer,
        orderId: order._id,
        type: 'debit'
      });
      if (session) walletDedQ.session(session);
      const walletDeduction = await walletDedQ;

      if (walletDeduction) {
        const walletAmount = Math.min(computedRefundAmount, Math.abs(walletDeduction.amount));
        if (walletAmount > 0) {
          await creditWallet({
            userId: order.customer,
            amount: walletAmount,
            description: `Refund (${splitRule.ruleMatched}) for Order #${order.orderId || order.orderNumber || order._id.toString().slice(-6)}`,
            orderId: order._id,
            adminId: initiatedBy,
            session
          });
          walletCredited = true;
          creditedAmount = walletAmount;
          refundMethod = 'wallet';
        }
      }

      const autoReasons = Array.isArray(refundConfig.autoRefundReasons) ? refundConfig.autoRefundReasons : [];
      const normalizedReason = String(reason || '').trim().toLowerCase();
      const isReasonAutoEligible = autoReasons.length === 0
        || autoReasons.some((r) => {
          const token = String(r || '').trim().toLowerCase();
          return token && (normalizedReason.includes(token) || splitRule.ruleMatched.toLowerCase().includes(token));
        });

      const shouldAutoCreditWallet =
        forceWalletRefund ||
        order.paymentMethod === 'wallet' ||
        initiatorRole === 'admin' ||
        (refundConfig.mode === 'auto' && isReasonAutoEligible);

      if (shouldAutoCreditWallet && computedRefundAmount > creditedAmount) {
        const remainingToCredit = Math.round((computedRefundAmount - creditedAmount) * 100) / 100;
        await creditWallet({
          userId: order.customer,
          amount: remainingToCredit,
          description: `Refund (${splitRule.ruleMatched}) for Order #${order.orderId || order.orderNumber || order._id.toString().slice(-6)}`,
          orderId: order._id,
          adminId: initiatedBy,
          session
        });
        walletCredited = true;
        creditedAmount = Math.round((creditedAmount + remainingToCredit) * 100) / 100;
        refundMethod = (refundConfig.mode === 'auto' && !walletDeduction && order.paymentMethod !== 'wallet') ? 'wallet_auto' : 'wallet';
      } else if (!walletCredited) {
        refundMethod = 'gateway';
      }
    } else {
      refundMethod = 'none';
    }

    const isCompleted = computedRefundAmount === 0 || (walletCredited && creditedAmount >= computedRefundAmount);

    order.refund = {
      status: computedRefundAmount === 0 ? 'none' : (isCompleted ? 'completed' : 'in_progress'),
      amount: computedRefundAmount,
      method: refundMethod,
      note: reason,
      ...(isCompleted && computedRefundAmount > 0 ? { refundedAt: new Date(), refundedBy: initiatedBy || undefined } : {}),
      responsibilitySplit: {
        ruleMatched: splitRule.ruleMatched,
        refundPercent: splitRule.refundPercent,
        restaurantPayablePercent: splitRule.restaurantPayablePercent,
        platformLossPercent: splitRule.platformLossPercent,
        restaurantPayableShare,
        platformLoss,
      }
    };
    if (computedRefundAmount > 0) {
      order.paymentStatus = isCompleted ? 'refunded' : 'refunding';
    }

    if (!skipOrderSave) {
      await order.save(session ? { session } : undefined);
    }

    // Create / Update RefundRequest Ledger entry
    let refundLedgerRecord = null;
    if (computedRefundAmount > 0) {
      const existingReqQ = RefundRequest.findOne({ order: order._id, status: { $ne: 'rejected' } });
      if (session) existingReqQ.session(session);
      const existingReq = await existingReqQ;

      const ledgerPayload = {
        order: order._id,
        user: order.customer,
        restaurant: order.restaurant || undefined,
        rider: order.rider || undefined,
        amount: computedRefundAmount,
        originalAmount: totalAmount,
        refundAmount: computedRefundAmount,
        restaurantPayableShare,
        platformLoss,
        reason: splitRule.ledgerReason,
        cancellationDetails: reason || `${initiatorRole} cancellation`,
        method: refundMethod === 'gateway' ? 'gateway' : 'wallet',
        paymentMode: order.paymentMethod || 'online',
        status: isCompleted ? 'processed' : 'pending',
        requestedBy: initiatedBy || order.customer,
        ...(isCompleted ? { processedBy: initiatedBy || undefined, processedAt: new Date() } : {}),
        note: `Rule: ${splitRule.ruleMatched} (${splitRule.refundPercent}% refund | Rest: ${splitRule.restaurantPayablePercent}% | Platform: ${splitRule.platformLossPercent}%)`
      };

      if (existingReq) {
        Object.assign(existingReq, ledgerPayload);
        await existingReq.save(session ? { session } : undefined);
        refundLedgerRecord = existingReq;
      } else {
        const created = await RefundRequest.create([ledgerPayload], session ? { session } : undefined);
        refundLedgerRecord = Array.isArray(created) ? created[0] : created;
      }
    }

    if (restaurantPayableShare > 0) {
      await applyRestaurantLiabilityToLedger(order, restaurantPayableShare, session);
    }

    await AuditLog.log({
      entity: 'Order',
      entityId: order._id,
      action: 'refund',
      userId: initiatedBy || order.customer,
      userRole: initiatorRole || 'system',
      changes: {
        field: 'refund',
        oldValue: null,
        newValue: order.refund
      },
      reason: reason,
      metadata: {
        refundAmount: computedRefundAmount,
        refundPercentage: splitRule.refundPercent,
        walletCredited,
        creditedAmount,
        method: refundMethod,
        responsibilitySplit: splitRule,
        restaurantPayableShare,
        platformLoss,
        refundMode: refundConfig.mode,
        refundRequestId: refundLedgerRecord?._id
      }
    }).catch(() => {});

    return {
      success: true,
      message: computedRefundAmount === 0
        ? 'No refund applicable per cancellation rule'
        : (isCompleted ? 'Refund completed - wallet credited' : 'Refund request created - pending admin approval'),
      refundAmount: computedRefundAmount,
      refundPercentage: splitRule.refundPercent,
      restaurantPayableShare,
      platformLoss,
      method: refundMethod,
      status: isCompleted ? 'completed' : 'pending',
      walletCredited,
      responsibilitySplit: splitRule,
      refundRequest: refundLedgerRecord,
      order
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
async function creditWallet({
  userId,
  amount,
  description,
  orderId = null,
  adminId = null,
  session = null
}) {
  const createdTxns = await WalletTransaction.create([{
    user: userId,
    amount: Math.abs(amount),
    type: 'credit',
    description: description,
    orderId: orderId,
    adminAction: adminId ? true : false,
    adminId: adminId
  }], session ? { session } : undefined);
  const transaction = Array.isArray(createdTxns) ? createdTxns[0] : createdTxns;
  await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: Math.abs(amount) } },
    session ? { session } : undefined
  );
  await AuditLog.log({
    entity: 'Wallet',
    entityId: transaction._id,
    action: 'wallet_credit',
    userId: adminId || userId,
    userRole: adminId ? 'admin' : 'customer',
    changes: {
      field: 'balance',
      oldValue: null,
      newValue: amount
    },
    reason: description,
    metadata: {
      orderId: orderId,
      transactionId: transaction._id
    }
  }).catch(() => {});
  return transaction;
}
async function debitWallet({
  userId,
  amount,
  description,
  orderId = null,
  adminId = null
}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if ((user.walletBalance || 0) < amount) {
    throw new Error('Insufficient wallet balance');
  }
  const transaction = await WalletTransaction.create({
    user: userId,
    amount: Math.abs(amount),
    type: 'debit',
    description: description,
    orderId: orderId,
    adminAction: adminId ? true : false,
    adminId: adminId
  });
  await User.findByIdAndUpdate(userId, {
    $inc: { walletBalance: -Math.abs(amount) }
  });
  await AuditLog.log({
    entity: 'Wallet',
    entityId: transaction._id,
    action: 'wallet_debit',
    userId: adminId || userId,
    userRole: adminId ? 'admin' : 'customer',
    changes: {
      field: 'balance',
      oldValue: null,
      newValue: -amount
    },
    reason: description,
    metadata: {
      orderId: orderId,
      transactionId: transaction._id
    }
  });
  return transaction;
}
async function completeRefund({
  orderId,
  gatewayTransactionId,
  completedBy,
  notes
}) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.refund.status !== 'in_progress') {
    throw new Error('Refund is not in progress');
  }
  order.refund.status = 'completed';
  order.refund.refundedAt = new Date();
  order.refund.refundedBy = completedBy;
  order.refund.gatewayTransactionId = gatewayTransactionId;
  if (notes) {
    order.refund.note = (order.refund.note || '') + ' | ' + notes;
  }
  await order.save();
  await AuditLog.log({
    entity: 'Order',
    entityId: order._id,
    action: 'refund',
    userId: completedBy,
    userRole: 'admin',
    changes: {
      field: 'refund.status',
      oldValue: 'in_progress',
      newValue: 'completed'
    },
    reason: 'Refund completed via payment gateway',
    metadata: {
      gatewayTransactionId: gatewayTransactionId,
      notes: notes
    }
  });
  return order;
}
async function getPendingRefunds() {
  const orders = await Order.find({
    'refund.status': 'in_progress',
    'refund.method': { $ne: 'wallet' } // Only gateway refunds need admin action
  })
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name')
    .sort({ 'refund.createdAt': -1 })
    .lean();
  return orders;
}
module.exports = {
  processRefund,
  resolveRefundRule,
  applyRestaurantLiabilityToLedger,
  creditWallet,
  debitWallet,
  completeRefund,
  getPendingRefunds
};
