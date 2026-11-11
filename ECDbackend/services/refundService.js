
const Order = require('../models/Order');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AdminSetting = require('../models/AdminSetting');
const { isCOD, isOnline } = require('../utils/paymentHelpers');

function resolveRefundRule(refundConfig, reason = '') {
  const normalizedReason = String(reason || '').trim().toLowerCase();
  const rules = Array.isArray(refundConfig?.reasonRules) ? refundConfig.reasonRules : [];
  const matched = rules.find((r) => {
    const k = String(r.reasonKey || '').trim().toLowerCase();
    const l = String(r.label || '').trim().toLowerCase();
    return (k && normalizedReason.includes(k)) || (l && normalizedReason.includes(l));
  });
  return {
    ruleMatched: matched?.reasonKey || 'default',
    refundPercent: matched?.refundPercent !== undefined ? Number(matched.refundPercent) : 100,
    restaurantPayablePercent: matched?.restaurantPayablePercent !== undefined ? Number(matched.restaurantPayablePercent) : 0,
    platformLossPercent: matched?.platformLossPercent !== undefined ? Number(matched.platformLossPercent) : 0,
  };
}

async function processRefund({
  orderId,
  order = null,
  reason,
  initiatedBy,
  initiatorRole
}) {
  try {
    if (!order) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }
    if (order.refund && order.refund.status === 'completed') {
      return {
        success: false,
        error: 'Order already refunded'
      };
    }
    if (isCOD(order)) {
      return {
        success: true,
        message: 'COD order - no refund needed',
        refundAmount: 0,
        method: 'none'
      };
    }

    const settings = await AdminSetting.getSettings().catch(() => null);
    const refundConfig = settings?.refundConfig || { mode: 'manual', autoRefundReasons: [] };
    const splitRule = resolveRefundRule(refundConfig, reason);
    const refundAmount = Math.max(0, Math.round((Number(order.totalAmount || 0) * splitRule.refundPercent) / 100));

    let refundMethod = 'pending'; // Default: needs admin to process via gateway
    let walletCredited = false;
    let creditedAmount = 0;
    const user = await User.findById(order.customer);
    if (!user) {
      return {
        success: false,
        error: 'Customer not found'
      };
    }
    const walletDeduction = await WalletTransaction.findOne({
      user: order.customer,
      orderId: order._id,
      type: 'debit'
    });
    if (walletDeduction) {
      const walletAmount = Math.min(refundAmount, Math.abs(walletDeduction.amount));
      if (walletAmount > 0) {
        await creditWallet({
          userId: order.customer,
          amount: walletAmount,
          description: `Refund for cancelled order #${order._id}`,
          orderId: order._id,
          adminId: initiatedBy
        });
        walletCredited = true;
        creditedAmount = walletAmount;
        refundMethod = 'wallet';
      }
    }

    const autoReasons = Array.isArray(refundConfig.autoRefundReasons) ? refundConfig.autoRefundReasons : [];
    const normalizedReason = String(reason || '').trim().toLowerCase();
    const isReasonAutoEligible = autoReasons.length === 0
      || autoReasons.some((r) => normalizedReason.includes(String(r || '').trim().toLowerCase()));

    if (refundConfig.mode === 'auto' && isReasonAutoEligible && refundAmount > creditedAmount) {
      const remainingToCredit = refundAmount - creditedAmount;
      await creditWallet({
        userId: order.customer,
        amount: remainingToCredit,
        description: `Auto-refund (${splitRule.ruleMatched}) for order #${order.orderNumber || order._id}`,
        orderId: order._id,
        adminId: initiatedBy
      });
      walletCredited = true;
      creditedAmount += remainingToCredit;
      refundMethod = walletDeduction ? 'wallet' : 'wallet_auto';
    }

    order.refund = {
      status: 'in_progress',
      amount: refundAmount,
      method: refundMethod,
      note: reason,
      responsibilitySplit: splitRule
    };
    if (walletCredited && creditedAmount >= refundAmount) {
      order.refund.status = 'completed';
      order.refund.refundedAt = new Date();
      order.refund.refundedBy = initiatedBy;
    }
    order.paymentStatus = 'refunded';
    await order.save();
    await AuditLog.log({
      entity: 'Order',
      entityId: order._id,
      action: 'refund',
      userId: initiatedBy,
      userRole: initiatorRole,
      changes: {
        field: 'refund',
        oldValue: null,
        newValue: order.refund
      },
      reason: reason,
      metadata: {
        refundAmount: refundAmount,
        walletCredited: walletCredited,
        creditedAmount,
        method: refundMethod,
        responsibilitySplit: splitRule,
        refundMode: refundConfig.mode
      }
    });
    return {
      success: true,
      message: walletCredited ? 'Refund completed - wallet credited' : 'Refund initiated - admin will process',
      refundAmount: refundAmount,
      method: refundMethod,
      walletCredited: walletCredited,
      responsibilitySplit: splitRule,
      order: order
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
  adminId = null
}) {
  const transaction = await WalletTransaction.create({
    user: userId,
    amount: Math.abs(amount),
    type: 'credit',
    description: description,
    orderId: orderId,
    adminAction: adminId ? true : false,
    adminId: adminId
  });
  await User.findByIdAndUpdate(userId, {
    $inc: { walletBalance: Math.abs(amount) }
  });
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
  });
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
  creditWallet,
  debitWallet,
  completeRefund,
  getPendingRefunds
};
