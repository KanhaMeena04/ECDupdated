const mongoose = require('mongoose');
const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bank', 'upi', 'manual'], default: 'upi' },
  bankDetails: { type: Object },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
  adminNote: { type: String },
  utrNumber: { type: String },
  approvedBy: { type: String },
  rejectedBy: { type: String },
  processedAt: { type: Date },
  paidVia: { type: String, enum: ['upi', 'bank', 'cash', 'manual'] },
  paidToDetails: { type: Object }
}, { timestamps: true });
module.exports = mongoose.model('WithdrawalRequest', withdrawalSchema);

