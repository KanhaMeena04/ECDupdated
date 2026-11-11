const Order = require('../models/Order');
const SettlementLedger = require('../models/SettlementLedger');
const RefundRequest = require('../models/RefundRequest');
const AdminSetting = require('../models/AdminSetting');

const DEFAULT_GATEWAY_FEE_RATE = 0.018; // 1.8% gateway charge on online/card gateway transactions only

function buildDateFilter(startDate, endDate) {
  if (!startDate && !endDate) return null;
  const createdAt = {};
  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) createdAt.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      // Include full end day when YYYY-MM-DD date-only input is provided
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate).trim())) {
        end.setHours(23, 59, 59, 999);
      }
      createdAt.$lte = end;
    }
  }
  return Object.keys(createdAt).length > 0 ? createdAt : null;
}

exports.getFinanceDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = buildDateFilter(startDate, endDate);
    const query = dateRange ? { createdAt: dateRange } : {};
    const deliveredQuery = { ...query, status: 'delivered' };
    const cancelledQuery = { ...query, status: { $in: ['cancelled', 'rejected'] } };

    const [
      allOrdersCount,
      cancelledOrdersCount,
      deliveredOrders,
      refundRequests,
      gatewayRateSetting
    ] = await Promise.all([
      Order.countDocuments(query),
      Order.countDocuments(cancelledQuery),
      Order.find(deliveredQuery)
        .select('_id totalAmount itemTotal deliveryFee platformFee packagingFee discount couponCode paymentMethod paymentStatus riderCommission riderEarning driverEarnings adminCommission restaurantCommission')
        .lean(),
      RefundRequest.find({ ...query, status: { $in: ['approved', 'processed'] } }).lean(),
      AdminSetting.findOne({ key: 'paymentGatewayFeePercent' }).lean().catch(() => null)
    ]);

    const gatewayFeeRate = gatewayRateSetting?.value !== undefined && !Number.isNaN(Number(gatewayRateSetting.value))
      ? Number(gatewayRateSetting.value) / 100
      : DEFAULT_GATEWAY_FEE_RATE;

    const deliveredOrderIds = deliveredOrders.map(o => o._id);
    const settlements = deliveredOrderIds.length > 0
      ? await SettlementLedger.find({ order: { $in: deliveredOrderIds } }).lean()
      : [];

    const ledgerByOrderId = new Map();
    settlements.forEach(s => {
      if (s.order) ledgerByOrderId.set(String(s.order), s);
    });

    // Financial calculations aligned 1:1 with delivered orders
    let gmv = 0;
    let onlineGatewayGmv = 0;
    let walletGmv = 0;
    let codGmv = 0;
    let commissionRevenue = 0;
    let customerDeliveryFees = 0;
    let riderEarnings = 0;
    let customerPlatformFees = 0;
    let promotionalSubsidy = 0; // Platform-borne discount only
    let restaurantPayable = 0;
    let packagingFees = 0;

    deliveredOrders.forEach(o => {
      const orderTotal = Number(o.totalAmount || 0);
      const method = String(o.paymentMethod || 'cod').toLowerCase();
      gmv += orderTotal;

      if (method === 'online' || method === 'card') {
        onlineGatewayGmv += orderTotal;
      } else if (method === 'wallet') {
        walletGmv += orderTotal;
      } else {
        codGmv += orderTotal;
      }

      customerDeliveryFees += Number(o.deliveryFee || 0);
      riderEarnings += Number(o.riderCommission || o.riderEarning || o.driverEarnings || 0);
      customerPlatformFees += Number(o.platformFee || 0);
      packagingFees += Number(o.packagingFee || 0);

      const ledger = ledgerByOrderId.get(String(o._id));
      if (ledger) {
        commissionRevenue += Number(ledger.platformCommissionAmount || ledger.platformCommission || 0);
        restaurantPayable += Number(ledger.netPayable || ledger.restaurantEarning || 0);

        const totalDiscount = Number(o.discount || 0);
        const restDiscountShare = Number(ledger.couponDiscountShare || 0);
        promotionalSubsidy += Math.max(0, totalDiscount - restDiscountShare);
      } else {
        commissionRevenue += Number(o.adminCommission || 0);
        restaurantPayable += Number(o.restaurantCommission || 0);
        promotionalSubsidy += Number(o.discount || 0);
      }
    });

    const totalRefunds = refundRequests.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);
    const platformBorneRefunds = refundRequests.reduce((sum, r) => sum + Number(r.platformLoss || 0), 0);

    // Unclamped delivery margin so delivery fee subsidies / losses are clearly reflected
    const deliveryMargin = customerDeliveryFees - riderEarnings;
    // Gateway costs apply ONLY to external gateway payments (online/card), NEVER to COD or internal Wallet
    const gatewayCosts = parseFloat((onlineGatewayGmv * gatewayFeeRate).toFixed(2));

    // Net Platform Revenue = Commission + Delivery Margin + Customer Fees − Promotional Subsidy − Platform-borne Refunds − Gateway Costs
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
      deliveredOrdersCount: deliveredOrders.length,
      cancelledOrdersCount,
      gmv: parseFloat(gmv.toFixed(2)),
      onlineGatewayGmv: parseFloat(onlineGatewayGmv.toFixed(2)),
      walletGmv: parseFloat(walletGmv.toFixed(2)),
      codGmv: parseFloat(codGmv.toFixed(2)),
      onlinePayments: parseFloat((onlineGatewayGmv + walletGmv).toFixed(2)),
      codPayments: parseFloat(codGmv.toFixed(2)),
      restaurantPayable: parseFloat(restaurantPayable.toFixed(2)),
      riderPayable: parseFloat(riderEarnings.toFixed(2)),
      packagingFees: parseFloat(packagingFees.toFixed(2)),
      totalRefunds: parseFloat(totalRefunds.toFixed(2)),
      commissionRevenue: parseFloat(commissionRevenue.toFixed(2)),
      deliveryRevenue: parseFloat(customerDeliveryFees.toFixed(2)),
      deliveryMargin: parseFloat(deliveryMargin.toFixed(2)),
      customerFees: parseFloat(customerPlatformFees.toFixed(2)),
      promotionalSubsidy: parseFloat(promotionalSubsidy.toFixed(2)),
      platformBorneRefunds: parseFloat(platformBorneRefunds.toFixed(2)),
      gatewayFeePercent: parseFloat((gatewayFeeRate * 100).toFixed(2)),
      gatewayCosts,
      netPlatformRevenue
    };

    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
