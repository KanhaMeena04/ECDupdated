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
  pricingModel: {
    type: String,
    enum: ['b2b', 'commission'],
    default: 'b2b'
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
  const isComm = Boolean(restaurant?.pricingModel === 'commission' || restaurant?.useCommissionModel === true || order.pricingModel === 'commission');
  const appliedModel = isComm ? 'commission' : 'b2b';
  
  const grossSales = order.itemTotal || (order.totalAmount - (order.deliveryFee || 0) - (order.packagingFee || 0) - (order.tax || 0));
  const packagingFee = order.packagingFee || 0;
  
  let platformCommissionAmount = 0;
  let commissionPercent = 0;
  let netPayable = 0;

  if (order.adminCommission !== undefined && order.adminCommission !== null && order.restaurantCommission !== undefined && order.restaurantCommission !== null) {
    platformCommissionAmount = Number(order.adminCommission);
    netPayable = Number(order.restaurantCommission);
    commissionPercent = Number(order.appliedCommissionRate ?? (grossSales > 0 ? Math.round((platformCommissionAmount / grossSales) * 100) : 0));
  } else if (!isComm) {
    // B2B calculation: calculate exact sum of negotiated item B2B prices
    let b2bSum = 0;
    if (order.items && Array.isArray(order.items)) {
      const Product = mongoose.model('Product');
      for (const it of order.items) {
        let uB2b = it.b2bPrice;
        if (uB2b === undefined || uB2b === null || isNaN(uB2b) || uB2b <= 0) {
          const p = await Product.findById(it.product).lean();
          uB2b = p?.b2bPrice ?? p?.pricing?.b2b?.sellingPrice ?? (it.price * (1 - (restaurant?.adminCommission || 20) / 100));
        }
        b2bSum += Number(uB2b) * (it.quantity || 1);
      }
    }
    netPayable = Math.round(b2bSum * 100) / 100;
    platformCommissionAmount = Math.max(0, Math.round((grossSales - netPayable) * 100) / 100);
    commissionPercent = grossSales > 0 ? Math.round((platformCommissionAmount / grossSales) * 100) : 0;
  } else {
    commissionPercent = restaurant?.adminCommission || 20;
    platformCommissionAmount = parseFloat(((grossSales * commissionPercent) / 100).toFixed(2));
    netPayable = Math.max(0, parseFloat((grossSales - platformCommissionAmount).toFixed(2)));
  }

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
  const finalNetPayable = Math.max(0, parseFloat((netPayable - couponDiscountShare).toFixed(2)));

  const existingLedger = await this.findOne({ order: order._id });
  if (existingLedger) {
    existingLedger.pricingModel = appliedModel;
    existingLedger.grossSales = grossSales;
    existingLedger.packagingFee = packagingFee;
    existingLedger.platformCommissionPercent = commissionPercent;
    existingLedger.platformCommissionAmount = platformCommissionAmount;
    existingLedger.couponDiscountShare = couponDiscountShare;
    existingLedger.couponFundingSource = couponFundingSource;
    existingLedger.netPayable = finalNetPayable;
    existingLedger.restaurantEarning = finalNetPayable;
    existingLedger.orderType = isPickup ? 'self_pickup' : 'delivery';
    existingLedger.deliveryFee = deliveryFee;
    existingLedger.taxCollected = taxCollected;
    await existingLedger.save();
    return existingLedger;
  }

  return await this.create({
    order: order._id,
    restaurant: restaurant._id,
    pricingModel: appliedModel,
    orderType: isPickup ? 'self_pickup' : 'delivery',
    grossSales: grossSales,
    packagingFee: packagingFee,
    platformCommissionPercent: commissionPercent,
    platformCommissionAmount: platformCommissionAmount,
    couponDiscountShare: couponDiscountShare,
    couponFundingSource: couponFundingSource,
    taxCollected: taxCollected,
    deliveryFee: deliveryFee,
    netPayable: finalNetPayable,
    restaurantEarning: finalNetPayable,
    platformCommission: platformCommissionAmount,
    orderAmount: order.totalAmount,
    status: 'CALCULATED',
    settlementCycle: restaurant.settlementCycle || 'T+2'
  });
};

module.exports = mongoose.model('SettlementLedger', settlementLedgerSchema);