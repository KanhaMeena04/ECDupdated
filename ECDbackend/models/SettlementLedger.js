const mongoose = require('mongoose');

const settlementLedgerSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  settlementId: {
    type: String,
    unique: true,
    index: true,
    default: function() {
      return 'SET-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    }
  },
  orderType: {
    type: String,
    enum: ['delivery', 'self_pickup'],
    default: 'delivery',
    index: true
  },
  grossSales: {
    type: Number,
    required: true,
    comment: 'Food item total gross sales'
  },
  packagingFee: {
    type: Number,
    default: 0,
    comment: 'Packaging fee component'
  },
  platformCommissionPercent: {
    type: Number,
    required: true,
    default: 20,
    comment: 'Commission percentage applied'
  },
  platformCommissionAmount: {
    type: Number,
    required: true,
    comment: 'Calculated platform commission'
  },
  couponDiscountShare: {
    type: Number,
    default: 0,
    comment: 'Discount amount borne by restaurant'
  },
  couponFundingSource: {
    type: String,
    enum: ['ECDKART', 'RESTAURANT', 'SHARED'],
    default: 'ECDKART'
  },
  refundDeduction: {
    type: Number,
    default: 0,
    comment: 'Deductions due to customer refund/cancellation'
  },
  taxCollected: {
    type: Number,
    default: 0,
    comment: 'Taxes collected'
  },
  deliveryFee: {
    type: Number,
    default: 0,
    comment: 'Delivery fee (0 for self_pickup)'
  },
  netPayable: {
    type: Number,
    required: true,
    comment: 'Net amount payable to restaurant = grossSales + packagingFee - commission - restaurantDiscountShare - refundDeduction'
  },
  restaurantEarning: {
    type: Number,
    comment: 'Alias for netPayable for backward compatibility'
  },
  orderAmount: {
    type: Number,
    comment: 'Total customer order paid amount'
  },
  platformCommission: {
    type: Number,
    comment: 'Alias for platformCommissionAmount for backward compatibility'
  },
  status: {
    type: String,
    enum: ['CALCULATED', 'REVIEW', 'APPROVED', 'PROCESSING', 'PAID', 'RECONCILED', 'PAYMENT_FAILED', 'RETRY', 'pending', 'completed', 'failed'],
    default: 'CALCULATED',
    index: true
  },
  settlementCycle: {
    type: String,
    enum: ['T+1', 'T+2', 'T+3', 'Weekly', 'Custom'],
    default: 'T+2'
  },
  settlementPeriodStart: {
    type: Date
  },
  settlementPeriodEnd: {
    type: Date
  },
  settlementBatchId: {
    type: String,
    index: true,
    comment: 'Batch ID if settled as part of bulk payment'
  },
  settledAt: {
    type: Date,
    index: true
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: 'Admin who approved or marked as paid'
  },
  paymentReference: {
    type: String,
    comment: 'Bank transaction ID, UTR, or external reference'
  },
  settlementMethod: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'wallet', 'other'],
    default: 'bank_transfer'
  },
  notes: {
    type: String
  },
  disputeReason: {
    type: String
  }
}, {
  timestamps: true
});

settlementLedgerSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
settlementLedgerSchema.index({ status: 1, createdAt: -1 });

settlementLedgerSchema.pre('save', function(next) {
  if (!this.restaurantEarning) {
    this.restaurantEarning = this.netPayable;
  }
  if (!this.platformCommission) {
    this.platformCommission = this.platformCommissionAmount;
  }
  if (!this.orderAmount) {
    this.orderAmount = this.grossSales + this.packagingFee + this.taxCollected + (this.deliveryFee || 0);
  }
  if (typeof next === 'function') next();
});

settlementLedgerSchema.statics.createFromOrder = async function(order, restaurant) {
  const isPickup = order.orderType === 'self_pickup' || order.orderType === 'pickup' || order.isSelfPickup;
  const commissionPercent = restaurant.adminCommission || restaurant.commissionRate || 20;
  
  const grossSales = order.itemTotal || (order.totalAmount - (order.deliveryFee || 0) - (order.packagingFee || 0) - (order.tax || 0));
  const packagingFee = order.packagingFee || 0;
  const platformCommissionAmount = parseFloat(((grossSales * commissionPercent) / 100).toFixed(2));
  
  // Calculate coupon discount sharing
  let couponDiscountShare = 0;
  let couponFundingSource = 'ECDKART';
  if (order.discount && order.discount > 0) {
    if (order.couponFundingSource === 'RESTAURANT') {
      couponDiscountShare = order.discount;
      couponFundingSource = 'RESTAURANT';
    } else if (order.couponFundingSource === 'SHARED') {
      const sharePercent = order.restaurantDiscountSharePercent || 50;
      couponDiscountShare = parseFloat(((order.discount * sharePercent) / 100).toFixed(2));
      couponFundingSource = 'SHARED';
    }
  }

  const deliveryFee = isPickup ? 0 : (order.deliveryFee || 0);
  const taxCollected = order.tax || 0;

  const netPayable = Math.max(0, parseFloat((grossSales + packagingFee - platformCommissionAmount - couponDiscountShare).toFixed(2)));

  const existingLedger = await this.findOne({ order: order._id });
  if (existingLedger) {
    existingLedger.grossSales = grossSales;
    existingLedger.packagingFee = packagingFee;
    existingLedger.platformCommissionPercent = commissionPercent;
    existingLedger.platformCommissionAmount = platformCommissionAmount;
    existingLedger.couponDiscountShare = couponDiscountShare;
    existingLedger.couponFundingSource = couponFundingSource;
    existingLedger.netPayable = netPayable;
    existingLedger.restaurantEarning = netPayable;
    existingLedger.orderType = isPickup ? 'self_pickup' : 'delivery';
    existingLedger.deliveryFee = deliveryFee;
    existingLedger.taxCollected = taxCollected;
    await existingLedger.save();
    return existingLedger;
  }

  return await this.create({
    order: order._id,
    restaurant: restaurant._id,
    orderType: isPickup ? 'self_pickup' : 'delivery',
    grossSales: grossSales,
    packagingFee: packagingFee,
    platformCommissionPercent: commissionPercent,
    platformCommissionAmount: platformCommissionAmount,
    couponDiscountShare: couponDiscountShare,
    couponFundingSource: couponFundingSource,
    taxCollected: taxCollected,
    deliveryFee: deliveryFee,
    netPayable: netPayable,
    restaurantEarning: netPayable,
    platformCommission: platformCommissionAmount,
    orderAmount: order.totalAmount,
    status: 'CALCULATED',
    settlementCycle: restaurant.settlementCycle || 'T+2'
  });
};

module.exports = mongoose.model('SettlementLedger', settlementLedgerSchema);
