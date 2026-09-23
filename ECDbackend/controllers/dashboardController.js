const Order = require("../models/Order");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
exports.getOverview = async (req, res) => {
  try {
    const [totalUsers, totalRiders, totalRestaurants] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      Rider.countDocuments({}),
      Restaurant.countDocuments({}),
    ]);
    const deliveredMatch = { status: "delivered" };
    const earningsAgg = await Order.aggregate([
      { $match: deliveredMatch },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $ifNull: ["$totalAmount", 0] } },
          totalCommission: { $sum: { $ifNull: ["$adminCommission", 0] } },
          totalRestaurantCommission: {
            $sum: { $ifNull: ["$restaurantCommission", 0] },
          },
          totalDeliveryCommission: {
            $sum: {
              $add: [
                { $ifNull: ["$riderEarning", 0] },
                {
                  $cond: [
                    { $gt: ["$riderEarning", 0] },
                    0,
                    { $add: [{ $ifNull: ["$riderCommission", 0] }, { $ifNull: ["$tip", 0] }] },
                  ],
                },
              ],
            },
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
      { $match: { ...deliveredMatch, deliveredAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } } } },
    ]);
    const todayEarnings = todayAgg[0]?.total || 0;
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
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
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
      name: u.name || "",
      orders: u.orders || 0,
      amount: Number(u.amount || 0).toFixed(2),
    }));
    res.status(200).json({
      totalUsers,
      totalRiders,
      totalRestaurants,
      totalEarnings: Number(totalsRow.totalEarnings || 0),
      todayEarnings,
      totalCommission: Number(totalsRow.totalCommission || 0),
      totalRestaurantCommission: Number(totalsRow.totalRestaurantCommission || 0),
      totalDeliveryCommission: Number(totalsRow.totalDeliveryCommission || 0),
      ordersDelivered,
      ordersCancelled,
      ordersFailed,
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

