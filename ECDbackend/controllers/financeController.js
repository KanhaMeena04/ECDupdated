const Order = require('../models/Order');
const SettlementLedger = require('../models/SettlementLedger');
const RefundRequest = require('../models/RefundRequest');
const PaymentTransaction = require('../models/PaymentTransaction');
const AdminSetting = require('../models/AdminSetting');

exports.getFinanceDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Delivered orders filter
    const deliveredQuery = { ...query, status: 'delivered' };

    const [
      allOrdersCount,
      deliveredOrders,
      codTransactions,
      onlineTransactions,
      settlements,
      refundRequests
    ] = await Promise.all([
      Order.countDocuments(query),
      Order.find(deliveredQuery).lean(),
      PaymentTransaction.aggregate([
        { $match: { ...query, type: 'cod_collected' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      PaymentTransaction.aggregate([
        { $match: { ...query, type: { $in: ['online_payment', 'wallet_payment'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      SettlementLedger.find(query).lean(),
      RefundRequest.find({ ...query, status: 'approved' }).lean()
    ]);

    // Financial calculations
    let gmv = 0;
    let commissionRevenue = 0;
    let customerDeliveryFees = 0;
    let riderEarnings = 0;
    let customerPlatformFees = 0;
    let promotionalSubsidy = 0; // Admin borne discount
    let restaurantPayable = 0;
    let packagingFees = 0;

    deliveredOrders.forEach(o => {
      gmv += (o.totalAmount || 0);
      customerDeliveryFees += (o.deliveryFee || 0);
      riderEarnings += (o.riderCommission || o.riderEarning || 0);
      customerPlatformFees += (o.platformFee || 0);
      promotionalSubsidy += (o.discount || 0);
      packagingFees += (o.packagingFee || 0);
    });

    settlements.forEach(s => {
      commissionRevenue += (s.platformCommissionAmount || s.platformCommission || 0);
      restaurantPayable += (s.netPayable || s.restaurantEarning || 0);
    });

    const totalRefunds = refundRequests.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    const platformBorneRefunds = refundRequests.reduce((sum, r) => sum + (r.platformLoss || 0), 0);

    const deliveryMargin = Math.max(0, customerDeliveryFees - riderEarnings);
    const gatewayCosts = parseFloat((gmv * 0.018).toFixed(2)); // ~1.8% average payment gateway fee

    // Net Platform Revenue = Commission + Delivery Margin + Customer Fees + Other Platform Revenue − Promotional Subsidy − Platform-borne Refunds − Gateway Costs
    const netPlatformRevenue = parseFloat((
      commissionRevenue +
      deliveryMargin +
      customerPlatformFees -
      promotionalSubsidy -
      platformBorneRefunds -
      gatewayCosts
    ).toFixed(2));

    const metrics = {
      totalOrders: allOrdersCount,
      gmv: parseFloat(gmv.toFixed(2)),
      onlinePayments: parseFloat((onlineTransactions[0]?.total || 0).toFixed(2)),
      codPayments: parseFloat((codTransactions[0]?.total || 0).toFixed(2)),
      restaurantPayable: parseFloat(restaurantPayable.toFixed(2)),
      riderPayable: parseFloat(riderEarnings.toFixed(2)),
      totalRefunds: parseFloat(totalRefunds.toFixed(2)),
      commissionRevenue: parseFloat(commissionRevenue.toFixed(2)),
      deliveryRevenue: parseFloat(customerDeliveryFees.toFixed(2)),
      deliveryMargin: parseFloat(deliveryMargin.toFixed(2)),
      customerFees: parseFloat(customerPlatformFees.toFixed(2)),
      promotionalSubsidy: parseFloat(promotionalSubsidy.toFixed(2)),
      platformBorneRefunds: parseFloat(platformBorneRefunds.toFixed(2)),
      gatewayCosts: parseFloat(gatewayCosts.toFixed(2)),
      netPlatformRevenue: netPlatformRevenue
    };

    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
