const mongoose = require('mongoose');

const ReconciliationReportSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    transactionId: { type: String, default: '' },
    paymentGatewayUtractionId: { type: String, default: '' },
    expectedAmount: { type: Number, required: true },
    receivedAmount: { type: Number, required: true },
    discrepancyAmount: { type: Number, default: 0 },
    mismatchType: {
      type: String,
      enum: ['MISSING_PAYMENT', 'DUPLICATE_PAYMENT', 'WRONG_AMOUNT', 'FAILED_PAYOUT', 'PENDING_REFUND', 'RECONCILED'],
      required: true
    },
    status: {
      type: String,
      enum: ['UNRESOLVED', 'IN_REVIEW', 'RESOLVED'],
      default: 'UNRESOLVED'
    },
    notes: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReconciliationReport', ReconciliationReportSchema);
