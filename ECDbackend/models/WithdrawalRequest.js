const mongoose = require('mongoose');
const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  requestType: { type: String, enum: ['rider', 'restaurant', 'user'], default: 'rider', index: true },
  settlementLedger: { type: mongoose.Schema.Types.ObjectId, ref: 'SettlementLedger' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bank', 'upi', 'manual'], default: 'upi' },
  bankDetails: { type: Object },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending', index: true },
  adminNote: { type: String },
  utrNumber: { type: String },
  approvedBy: { type: String },
  rejectedBy: { type: String },
  processedAt: { type: Date },
  paidVia: { type: String, enum: ['upi', 'bank', 'cash', 'manual'] },
  paidToDetails: { type: Object }
}, { timestamps: true });
module.exports = mongoose.model('WithdrawalRequest', withdrawalSchema);

