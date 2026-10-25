const mongoose = require('mongoose');

const FinancialResetHistorySchema = new mongoose.Schema(
  {
    resetAt: { 
      type: Date, 
      default: Date.now, 
      index: true 
    },
    resetBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'Super Admin' },
      email: { type: String, default: 'admin@ecdkart.com' }
    },
    previousPeriodStart: { 
      type: Date,
      default: null
    },
    periodEnd: { 
      type: Date, 
      default: Date.now 
    },
    metrics: {
      totalEarnings: { type: Number, default: 0 },
      todayEarnings: { type: Number, default: 0 },
      totalCommission: { type: Number, default: 0 },
      totalRestaurantCommission: { type: Number, default: 0 },
      totalDeliveryCommission: { type: Number, default: 0 },
      ordersDelivered: { type: Number, default: 0 },
      ordersTotal: { type: Number, default: 0 },
      ordersCancelled: { type: Number, default: 0 },
      ordersFailed: { type: Number, default: 0 }
    },
    note: { 
      type: String, 
      default: 'Manual Reset from Admin Dashboard' 
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model('FinancialResetHistory', FinancialResetHistorySchema);
