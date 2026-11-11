const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');
const SettlementLedger = require('../models/SettlementLedger');
const RefundRequest = require('../models/RefundRequest');
const ReconciliationReport = require('../models/ReconciliationReport');

/**
 * Helper to upsert a reconciliation discrepancy record without creating duplicates.
 */
async function flagMismatch({
  orderId,
  transactionId = '',
  gatewayRef = '',
  expectedAmount = 0,
  receivedAmount = 0,
  mismatchType,
  notes = ''
}) {
  const existing = await ReconciliationReport.findOne({ orderId, mismatchType });
  if (existing) {
    if (existing.status === 'RESOLVED') return null;
    existing.expectedAmount = expectedAmount;
    existing.receivedAmount = receivedAmount;
    existing.discrepancyAmount = Math.round((expectedAmount - receivedAmount) * 100) / 100;
    existing.notes = notes;
    await existing.save();
    return existing;
  }

  return ReconciliationReport.create({
    orderId,
    transactionId,
    paymentGatewayUtractionId: gatewayRef,
    expectedAmount,
    receivedAmount,
    discrepancyAmount: Math.round((expectedAmount - receivedAmount) * 100) / 100,
    mismatchType,
    status: 'UNRESOLVED',
    notes
  });
}

/**
 * Scans Orders, PaymentTransactions, SettlementLedgers, and RefundRequests
 * over the past lookbackDays to flag missing, duplicate, mismatched, failed payout,
 * or pending refund discrepancies.
 */
async function runAutoReconciliation({ lookbackDays = 30 } = {}) {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const summary = {
    scannedOrders: 0,
    newOrUpdatedFlags: 0,
    byType: {
      MISSING_PAYMENT: 0,
      DUPLICATE_PAYMENT: 0,
      WRONG_AMOUNT: 0,
      FAILED_PAYOUT: 0,
      PENDING_REFUND: 0
    }
  };

  const orders = await Order.find({ createdAt: { $gte: since } }).lean();
  summary.scannedOrders = orders.length;

  const orderIds = orders.map(o => o._id);
  const [txs, ledgers, refunds] = await Promise.all([
    PaymentTransaction.find({ order: { $in: orderIds } }).lean(),
    SettlementLedger.find({ order: { $in: orderIds } }).lean(),
    RefundRequest.find({ order: { $in: orderIds } }).lean()
  ]);

  const txByOrder = new Map();
  for (const tx of txs) {
    const key = String(tx.order);
    if (!txByOrder.has(key)) txByOrder.set(key, []);
    txByOrder.get(key).push(tx);
  }

  const ledgerByOrder = new Map();
  for (const l of ledgers) {
    ledgerByOrder.set(String(l.order), l);
  }

  const refundByOrder = new Map();
  for (const r of refunds) {
    refundByOrder.set(String(r.order), r);
  }

  for (const order of orders) {
    const oid = String(order._id);
    const expectedAmt = Number(order.payableAmount ?? order.totalAmount ?? 0);
    const isOnlineOrder = order.paymentMethod === 'online' || order.paymentMethod === 'card';
    const orderTxs = txByOrder.get(oid) || [];
    const paymentTxs = orderTxs.filter(t => ['online_payment', 'wallet_payment', 'cod_collected'].includes(t.type) && t.status === 'completed');

    // 1. Duplicate payment check
    if (paymentTxs.length > 1 && isOnlineOrder) {
      const totalReceived = paymentTxs.reduce((s, t) => s + Number(t.amount || 0), 0);
      const flagged = await flagMismatch({
        orderId: order._id,
        transactionId: order.transactionId || String(paymentTxs[0]._id),
        expectedAmount: expectedAmt,
        receivedAmount: totalReceived,
        mismatchType: 'DUPLICATE_PAYMENT',
        notes: `${paymentTxs.length} completed payment transactions found for Order #${order.orderNumber || oid}`
      });
      if (flagged) {
        summary.newOrUpdatedFlags++;
        summary.byType.DUPLICATE_PAYMENT++;
      }
    }

    // 2. Missing payment on paid/delivered online order
    if (isOnlineOrder && (order.paymentStatus === 'paid' || order.status === 'delivered') && paymentTxs.length === 0 && !order.transactionId) {
      const flagged = await flagMismatch({
        orderId: order._id,
        expectedAmount: expectedAmt,
        receivedAmount: 0,
        mismatchType: 'MISSING_PAYMENT',
        notes: `Online order #${order.orderNumber || oid} is marked ${order.status}/${order.paymentStatus} without gateway transaction ID`
      });
      if (flagged) {
        summary.newOrUpdatedFlags++;
        summary.byType.MISSING_PAYMENT++;
      }
    }

    // 3. Wrong amount check
    if (paymentTxs.length === 1 && expectedAmt > 0) {
      const txAmt = Number(paymentTxs[0].amount || 0);
      if (Math.abs(txAmt - expectedAmt) > 2) {
        const flagged = await flagMismatch({
          orderId: order._id,
          transactionId: String(paymentTxs[0]._id),
          expectedAmount: expectedAmt,
          receivedAmount: txAmt,
          mismatchType: 'WRONG_AMOUNT',
          notes: `Expected ₹${expectedAmt} vs transaction ₹${txAmt} on Order #${order.orderNumber || oid}`
        });
        if (flagged) {
          summary.newOrUpdatedFlags++;
          summary.byType.WRONG_AMOUNT++;
        }
      }
    }

    // 4. Failed payout check
    const ledger = ledgerByOrder.get(oid);
    if (ledger && ledger.status === 'PAYMENT_FAILED') {
      const flagged = await flagMismatch({
        orderId: order._id,
        transactionId: ledger.settlementId || '',
        expectedAmount: Number(ledger.netPayable || 0),
        receivedAmount: 0,
        mismatchType: 'FAILED_PAYOUT',
        notes: `Settlement payout ${ledger.settlementId || ''} failed for Order #${order.orderNumber || oid}`
      });
      if (flagged) {
        summary.newOrUpdatedFlags++;
        summary.byType.FAILED_PAYOUT++;
      }
    }

    // 5. Pending refund check on cancelled paid online orders (> 2h old)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const refund = refundByOrder.get(oid);
    if (order.status === 'cancelled' && isOnlineOrder && order.paymentStatus === 'paid' && new Date(order.updatedAt).getTime() < twoHoursAgo) {
      if (!order.refund || order.refund.status !== 'completed') {
        if (!refund || refund.status === 'pending') {
          const flagged = await flagMismatch({
            orderId: order._id,
            transactionId: order.transactionId || '',
            expectedAmount: expectedAmt,
            receivedAmount: 0,
            mismatchType: 'PENDING_REFUND',
            notes: `Cancelled online order #${order.orderNumber || oid} still has pending refund`
          });
          if (flagged) {
            summary.newOrUpdatedFlags++;
            summary.byType.PENDING_REFUND++;
          }
        }
      }
    }
  }

  return summary;
}

module.exports = { runAutoReconciliation, flagMismatch };

