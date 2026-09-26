const Order = require("../models/Order");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
exports.getOverview = async (req, res) => {
  try {
    const Product = require("../models/Product");

    const [
      totalUsers,
      activeUsers,
      totalRiders,
      pendingRiders,
      approvedRiders,
      onlineRiders,
      totalRestaurants,
      pendingRestaurants,
      approvedRestaurants,
      activeRestaurants,
      offlineRestaurants,
      pendingMenuApprovals
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ isDeleted: { $ne: true }, role: "customer" }),
      Rider.countDocuments({}),
      Rider.countDocuments({ approvalStatus: "pending" }),
      Rider.countDocuments({ approvalStatus: "approved" }),
      Rider.countDocuments({ isOnline: true }),
      Restaurant.countDocuments({}),
      Restaurant.countDocuments({ restaurantApproved: false }),
      Restaurant.countDocuments({ restaurantApproved: true }),
      Restaurant.countDocuments({ isActive: true }),
      Restaurant.countDocuments({ isOnline: false }),
      Product.countDocuments({ isApproved: false, isRejected: { $ne: true } })
    ]);

    const deliveredMatch = { status: "delivered" };
    const earningsAgg = await Order.aggregate([
      { $match: deliveredMatch },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $ifNull: ["$totalAmount", 0] } },
          totalItemTotal: { $sum: { $ifNull: ["$itemTotal", 0] } },
          totalDiscounts: { $sum: { $ifNull: ["$discount", 0] } },
          totalDeliveryFees: { $sum: { $ifNull: ["$deliveryFee", 0] } },
          totalPlatformFees: { $sum: { $ifNull: ["$platformFee", 0] } },
          totalPackagingFees: { $sum: { $ifNull: ["$packagingFee", 0] } },
          totalTax: { $sum: { $ifNull: ["$tax", 0] } },
          totalTips: { $sum: { $ifNull: ["$tip", 0] } },
          totalCommission: { $sum: { $ifNull: ["$adminCommission", 0] } },
          totalRestaurantCommission: {
            $sum: { $ifNull: ["$restaurantShare", 0] },
          },
          totalRiderEarning: {
            $sum: { $ifNull: ["$riderEarning", 0] },
          },
        },
      },
    ]);
    const totalsRow = earningsAgg[0] || {};

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
          discounts: { $sum: { $ifNull: ["$discount", 0] } },
          deliveryFees: { $sum: { $ifNull: ["$deliveryFee", 0] } },
          platformFees: { $sum: { $ifNull: ["$platformFee", 0] } },
          packagingFees: { $sum: { $ifNull: ["$packagingFee", 0] } },
          tax: { $sum: { $ifNull: ["$tax", 0] } },
          adminCommission: { $sum: { $ifNull: ["$adminCommission", 0] } },
          riderEarning: { $sum: { $ifNull: ["$riderEarning", 0] } },
          count: { $sum: 1 }
        }
      }
    ]);

    let todayGOV = 0;
    let todayDiscounts = 0;
    let todayDeliveryFees = 0;
    let todayPlatformFees = 0;
    let todayPackagingFees = 0;
    let todayTax = 0;
    let todayAdminRevenue = 0;
    let todayRiderEarnings = 0;

    todayAgg.forEach(row => {
      todayGOV += row.totalAmount || 0;
      todayDiscounts += row.discounts || 0;
      todayDeliveryFees += row.deliveryFees || 0;
      todayPlatformFees += row.platformFees || 0;
      todayPackagingFees += row.packagingFees || 0;
      todayTax += row.tax || 0;
      todayAdminRevenue += row.adminCommission || 0;
      todayRiderEarnings += row.riderEarning || 0;
    });

    const statusAgg = await Order.aggregate([
      { $match: {} },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const statusMap = statusAgg.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    const ordersToday = todayAgg.reduce((sum, r) => sum + r.count, 0);
    const pendingOrders = statusMap["pending"] || 0;
    const acceptedOrders = statusMap["accepted"] || 0;
    const preparingOrders = statusMap["preparing"] || 0;
    const readyOrders = statusMap["ready"] || 0;
    const assignedOrders = statusMap["assigned"] || 0;
    const pickedUpOrders = statusMap["picked_up"] || 0;
    const outForDeliveryOrders = statusMap["out_for_delivery"] || 0;
    const ordersDelivered = statusMap["delivered"] || 0;
    const ordersCancelled = statusMap["cancelled"] || 0;
    const ordersFailed = statusMap["failed"] || 0;

    const monthsBack = 12;
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - (monthsBack - 1));
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const salesSeries = [];
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(monthStart);
      d.setMonth(monthStart.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = monthNames[d.getMonth()];
      const row = monthlyAgg.find((m) => m._id === key);
      salesSeries.push({ month: label, orders: row ? row.orders : 0 });
    }

    const recentOrdersDocs = await Order.find({})
      .select("_id status totalAmount createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentOrders = recentOrdersDocs.map((o) => ({
      id: String(o._id),
      status: o.status,
      amount: Number(o.totalAmount || 0).toFixed(2),
    }));

    const topRestaurantsAgg = await Order.aggregate([
      { $match: deliveredMatch },
      { $group: { _id: "$restaurant", orders: { $sum: 1 }, amount: { $sum: { $ifNull: ["$totalAmount", 0] } } } },
      { $sort: { orders: -1, amount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$restaurant.name.en", "$restaurant.name"] },
          orders: 1,
          amount: 1,
        },
      },
    ]);

    const topRestaurants = topRestaurantsAgg.map((r) => ({
      name: r.name || "Unknown",
      orders: r.orders || 0,
      amount: Number(r.amount || 0).toFixed(2),
    }));

    const topUsersAgg = await Order.aggregate([
      { $match: deliveredMatch },
      { $group: { _id: "$customer", orders: { $sum: 1 }, amount: { $sum: { $ifNull: ["$totalAmount", 0] } } } },
      { $sort: { orders: -1, amount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $project: { name: "$user.name", orders: 1, amount: 1 } },
    ]);

    const topUsers = topUsersAgg.map((u) => ({
      name: u.name || "Customer",
      orders: u.orders || 0,
      amount: Number(u.amount || 0).toFixed(2),
    }));

    res.status(200).json({
      // Business Overview
      totalUsers,
      activeUsers,
      totalRiders,
      pendingRiders,
      approvedRiders,
      onlineRiders,
      totalRestaurants,
      pendingRestaurants,
      approvedRestaurants,
      activeRestaurants,
      offlineRestaurants,
      pendingMenuApprovals,
      ordersToday,
      pendingOrders,
      acceptedOrders,
      preparingOrders,
      readyOrders,
      assignedOrders,
      pickedUpOrders,
      outForDeliveryOrders,
      ordersDelivered,
      ordersCancelled,
      ordersFailed,
      
      // Financial Overview
      todayGOV: Number(todayGOV.toFixed(2)),
      todayDiscounts: Number(todayDiscounts.toFixed(2)),
      todayDeliveryFees: Number(todayDeliveryFees.toFixed(2)),
      todayPlatformFees: Number(todayPlatformFees.toFixed(2)),
      todayPackagingFees: Number(todayPackagingFees.toFixed(2)),
      todayTax: Number(todayTax.toFixed(2)),
      todayAdminRevenue: Number(todayAdminRevenue.toFixed(2)),
      todayRiderEarnings: Number(todayRiderEarnings.toFixed(2)),
      totalEarnings: Number(totalsRow.totalEarnings || 0),
      totalCommission: Number(totalsRow.totalCommission || 0),
      totalRestaurantCommission: Number(totalsRow.totalRestaurantCommission || 0),
      totalDeliveryCommission: Number(totalsRow.totalRiderEarning || 0),

      // Visual Series & Lists
      salesSeries,
      recentOrders,
      topRestaurants,
      topUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantPayoutList = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).lean();
    const deliveredOrders = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: "$restaurant",
          totalOrders: { $sum: 1 },
          totalToBePaid: { $sum: { $ifNull: ["$restaurantShare", { $ifNull: ["$totalAmount", 0] }] } }
        }
      }
    ]);
    const map = {};
    deliveredOrders.forEach(o => {
      if (o._id) map[String(o._id)] = o;
    });

    const rows = restaurants.map((r, idx) => {
      const stats = map[String(r._id)] || { totalOrders: 0, totalToBePaid: 0 };
      const name = typeof r.name === 'object' ? (r.name.en || JSON.stringify(r.name)) : (r.name || 'Unnamed');
      return {
        id: idx + 1,
        restaurant: name,
        phone: r.phone ? `${r.phone.slice(0, 3)}****${r.phone.slice(-3)}` : 'N/A',
        totalOrders: stats.totalOrders,
        totalToBePaid: `₹${Number(stats.totalToBePaid || 0).toFixed(2)}`
      };
    });

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDriverPayoutList = async (req, res) => {
  try {
    const riders = await Rider.find({}).lean();
    const riderOrders = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: "$rider",
          totalOrders: { $sum: 1 },
          totalToBePaid: { $sum: { $ifNull: ["$riderEarning", { $ifNull: ["$deliveryFee", 0] }] } }
        }
      }
    ]);
    const map = {};
    riderOrders.forEach(o => {
      if (o._id) map[String(o._id)] = o;
    });

    const rows = riders.map((r, idx) => {
      const stats = map[String(r._id)] || { totalOrders: 0, totalToBePaid: 0 };
      return {
        id: idx + 1,
        driver: r.name || 'Unnamed Rider',
        phone: r.phone ? `${r.phone.slice(0, 3)}****${r.phone.slice(-3)}` : 'N/A',
        totalOrders: stats.totalOrders,
        totalToBePaid: `₹${Number(stats.totalToBePaid || 0).toFixed(2)}`
      };
    });

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantTransactionHistory = async (req, res) => {
  try {
    const orders = await Order.find({ status: "delivered" })
      .populate("restaurant", "name")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    const rows = orders.map((o, idx) => {
      const rName = o.restaurant ? (typeof o.restaurant.name === 'object' ? o.restaurant.name.en : o.restaurant.name) : 'Restaurant';
      const amount = o.restaurantShare || o.totalAmount || 0;
      return {
        id: idx + 1,
        restaurant: rName,
        total: `₹${Number(amount).toFixed(2)}`,
        transactionId: `TXN-${String(o._id).slice(-6).toUpperCase()}`,
        date: new Date(o.updatedAt || o.createdAt).toLocaleString('en-IN'),
        status: 'Success'
      };
    });

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDriverTransactionHistory = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ["delivered", "cancelled", "failed"] } })
      .populate("rider", "name")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    const rows = orders.map((o, idx) => {
      const dName = o.rider ? o.rider.name : 'Unassigned Rider';
      const amount = o.riderEarning || o.deliveryFee || 0;
      const status = o.status === 'delivered' ? 'Success' : 'Failed';
      return {
        id: idx + 1,
        driver: dName,
        total: `₹${Number(amount).toFixed(2)}`,
        transactionId: `TXN-${String(o._id).slice(-6).toUpperCase()}`,
        status
      };
    });

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

