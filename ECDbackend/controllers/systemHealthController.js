const mongoose = require('mongoose');
const os = require('os');
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const Restaurant = require('../models/Restaurant');
const ReconciliationReport = require('../models/ReconciliationReport');
const ScheduledChange = require('../models/ScheduledChange');
const socketService = require('../services/socketService');

const dbStateLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

exports.getSystemHealth = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const mem = process.memoryUsage();
    let connectedSockets = 0;
    try {
      const io = socketService.getIO();
      connectedSockets = io?.engine?.clientsCount || 0;
    } catch (_) {}

    const activeStatuses = ['placed', 'accepted', 'preparing', 'ready', 'ready_for_pickup', 'assigned', 'rider_assigned', 'reached_restaurant', 'picked_up', 'out_for_delivery', 'on_the_way'];
    const [totalOrders, activeOrders, onlineRiders, activeRestaurants, unresolvedMismatches, pendingScheduled] = await Promise.all([
      Order.countDocuments().catch(() => 0),
      Order.countDocuments({ status: { $in: activeStatuses } }).catch(() => 0),
      Rider.countDocuments({ isOnline: true }).catch(() => 0),
      Restaurant.countDocuments({ isActive: true, isOnline: true }).catch(() => 0),
      ReconciliationReport.countDocuments({ status: 'UNRESOLVED' }).catch(() => 0),
      ScheduledChange.countDocuments({ status: 'PENDING' }).catch(() => 0)
    ]);

    res.status(200).json({
      success: true,
      health: {
        status: dbState === 1 ? 'HEALTHY' : 'DEGRADED',
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        database: {
          state: dbStateLabels[dbState] || 'unknown',
          connected: dbState === 1,
          host: mongoose.connection.host || 'N/A',
          name: mongoose.connection.name || 'N/A'
        },
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
          systemFreeMb: Math.round(os.freemem() / 1024 / 1024)
        },
        realtime: {
          connectedSockets
        },
        metrics: {
          totalOrders,
          activeOrders,
          onlineRiders,
          activeRestaurants,
          unresolvedMismatches,
          pendingScheduledChanges: pendingScheduled
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIntegrationsStatus = async (req, res) => {
  try {
    const mask = (val) => (val && String(val).length > 6 ? `${String(val).slice(0, 4)}****${String(val).slice(-2)}` : val ? '****' : '');

    const integrations = [
      {
        key: 'mongodb',
        name: 'MongoDB Atlas Database',
        category: 'Database',
        configured: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
        connected: mongoose.connection.readyState === 1,
        details: mongoose.connection.readyState === 1 ? `Connected (${mongoose.connection.name})` : 'Disconnected'
      },
      {
        key: 'razorpay',
        name: 'Razorpay Payment Gateway',
        category: 'Payments',
        configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        connected: Boolean(process.env.RAZORPAY_KEY_ID),
        details: process.env.RAZORPAY_KEY_ID ? `Key: ${mask(process.env.RAZORPAY_KEY_ID)}` : 'Fallback test key active'
      },
      {
        key: 'stripe',
        name: 'Stripe Payment Gateway',
        category: 'Payments',
        configured: Boolean(process.env.STRIPE_SECRET_KEY),
        connected: Boolean(process.env.STRIPE_SECRET_KEY),
        details: process.env.STRIPE_SECRET_KEY ? `Key: ${mask(process.env.STRIPE_SECRET_KEY)}` : 'Not configured'
      },
      {
        key: 'twofactor',
        name: '2Factor SMS OTP Gateway',
        category: 'Messaging & OTP',
        configured: Boolean(process.env.TWO_FACTOR_API_KEY),
        connected: Boolean(process.env.TWO_FACTOR_API_KEY),
        details: process.env.TWO_FACTOR_API_KEY ? `Template: ${process.env.TWO_FACTOR_TEMPLATE_NAME || 'ECDKARTOTP'}` : 'Not configured'
      },
      {
        key: 'imagekit',
        name: 'ImageKit Media CDN',
        category: 'Media & Storage',
        configured: Boolean(process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT),
        connected: Boolean(process.env.IMAGEKIT_URL_ENDPOINT),
        details: process.env.IMAGEKIT_URL_ENDPOINT || 'Not configured'
      },
      {
        key: 'google_maps',
        name: 'Google Maps Platform',
        category: 'Maps & Geolocation',
        configured: Boolean(process.env.GOOGLE_MAPS_API_KEY),
        connected: Boolean(process.env.GOOGLE_MAPS_API_KEY),
        details: process.env.GOOGLE_MAPS_API_KEY ? `Key: ${mask(process.env.GOOGLE_MAPS_API_KEY)}` : 'Configured in mobile/admin clients'
      },
      {
        key: 'firebase',
        name: 'Firebase Cloud Messaging (FCM)',
        category: 'Push Notifications',
        configured: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT),
        connected: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT),
        details: process.env.FIREBASE_PROJECT_ID ? `Project: ${process.env.FIREBASE_PROJECT_ID}` : 'Check service account credentials'
      },
      {
        key: 'email_smtp',
        name: 'SMTP Email Service',
        category: 'Email',
        configured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        connected: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        details: process.env.EMAIL_USER ? `Sender: ${process.env.EMAIL_USER}` : 'Not configured'
      }
    ];

    res.status(200).json({ success: true, integrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

