const mongoose = require("mongoose");

const refundRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    amount: { type: Number, required: true },
    originalAmount: { type: Number },
    refundAmount: { type: Number, required: true },
    restaurantPayableShare: { type: Number, default: 0 },
    riderCompensation: { type: Number, default: 0 },
    platformLoss: { type: Number, default: 0 },
    reason: {
      type: String,
      enum: ["Customer", "Restaurant", "Timeout", "Rider unavailable", "Technical", "Food unavailable", "Other"],
      default: "Customer"
    },
    cancellationDetails: { type: String },
    method: { type: String, enum: ["wallet", "gateway"], default: "wallet" },
    paymentMode: { type: String, default: "online" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed"],
      default: "pending",
      index: true
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    note: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RefundRequest", refundRequestSchema);
