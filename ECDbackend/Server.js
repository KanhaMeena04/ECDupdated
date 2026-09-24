const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ecd_local_dev_jwt_secret_key_2026';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecdkart_local_dev';
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const riderRoutes = require('./routes/riderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const homeRoutes = require('./routes/homeRoutes');
const cityRoutes = require('./routes/cityRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const foodQuantityRoutes = require('./routes/foodQuantityRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const cartRoutes = require('./routes/cartRoutes');
const incentiveRoutes = require('./routes/incentiveRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const adminCmsRoutes = require('./routes/adminCmsRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN,
  process.env.SOCKET_IO_CLIENT_URL,
  'https://admin.ecdkart.co.in',
  'https://demo-foodpanda-admin-panel.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000'
].filter(Boolean);

const corsConfig = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const extraOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
    if (
      allowedOrigins.includes(origin) ||
      extraOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    // Permissive fallback so mobile/web preview apps never get blocked by CORS
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
};

const io = socketIO(server, {
  cors: corsConfig,
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
const initCronJobs = require('./services/cronService');
const initPaymentCronJobs = require('./services/paymentCronJobs');

app.use(cookieParser());
app.use(cors(corsConfig));
const { handleStripeWebhook } = require('./controllers/paymentController');
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const paymentRoutes = require('./routes/paymentRoutes');
const paymentSystemRoutes = require('./routes/paymentSystemRoutes'); // NEW: Swiggy-style payment system
app.use('/api/payment', paymentRoutes);
app.use('/api/payment', paymentSystemRoutes); // NEW: COD wallet, freeze, commission, weekly payout
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/payment', paymentSystemRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

app.use('/api/restaurants', restaurantRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);

app.use('/api/menu', menuRoutes);
app.use('/api/v1/menu', menuRoutes);

const { submitCategoryRequest } = require('./controllers/categoryRequestController');
const { protect: protectAuth, restaurantOwner: ownerAuth } = require('./middleware/authMiddleware');
app.post('/api/vendor/category-requests', protectAuth, ownerAuth, submitCategoryRequest);
app.post('/api/v1/vendor/category-requests', protectAuth, ownerAuth, submitCategoryRequest);

app.use('/api/orders', orderRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use('/api/riders', riderRoutes);
app.use('/api/v1/riders', riderRoutes);
app.use('/api/drivers', riderRoutes);
app.use('/api/v1/drivers', riderRoutes);

app.use('/api/admin/cms', adminCmsRoutes); // Must come BEFORE /api/admin
app.use('/api/admin/reports', reportRoutes); // Must come BEFORE /api/admin
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin/cms', adminCmsRoutes);
app.use('/api/v1/admin/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.use('/api/search', searchRoutes);
app.use('/api/v1/search', searchRoutes);

const homeCmsRoutes = require('./routes/homeCmsRoutes');
app.use('/api/home', homeCmsRoutes);
app.use('/api/v1/home', homeCmsRoutes);

const catalogCmsRoutes = require('./routes/catalogCmsRoutes');
app.use('/api/catalog', catalogCmsRoutes);
app.use('/api/v1/catalog', catalogCmsRoutes);

const pricingCmsRoutes = require('./routes/pricingCmsRoutes');
app.use('/api/pricing', pricingCmsRoutes);
app.use('/api/v1/pricing', pricingCmsRoutes);

app.use('/api/home', homeRoutes);
app.use('/api/v1/home', homeRoutes);

const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);
app.use('/api/v1/categories', categoryRoutes);

const { getCategories, getBanners, getPopularDishes } = require('./controllers/homeController');
app.get('/api/banners', getBanners);
app.get('/api/v1/banners', getBanners);
app.get('/api/popular-dishes', getPopularDishes);
app.get('/api/v1/popular-dishes', getPopularDishes);


app.use('/api/cities', cityRoutes);
app.use('/api/v1/cities', cityRoutes);

app.use('/api/zones', zoneRoutes);
app.use('/api/v1/zones', zoneRoutes);

app.use('/api/food-quantities', foodQuantityRoutes);
app.use('/api/v1/food-quantities', foodQuantityRoutes);

app.use('/api/user', userRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/users', userRoutes);

const addressRoutes = require('./routes/addressRoutes');
app.use('/api/addresses', addressRoutes);
app.use('/api/v1/addresses', addressRoutes);

app.use('/api/wallet', walletRoutes);
app.use('/api/v1/wallet', walletRoutes);

app.use('/api/cart', cartRoutes);
app.use('/api/v1/cart', cartRoutes);

const couponRoutes = require('./routes/couponRoutes');
app.use('/api/coupons', couponRoutes);
app.use('/api/v1/coupons', couponRoutes);

const razorpayRoutes = require('./routes/razorpayRoutes');
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/v1/razorpay', razorpayRoutes);

const issueRoutes = require('./routes/issueRoutes');
app.use('/api/issues', issueRoutes);
app.use('/api/v1/issues', issueRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/notifications', notificationRoutes);

const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.use('/api/incentives', incentiveRoutes);
app.use('/api/v1/incentives', incentiveRoutes);

app.use('/api/reviews', reviewRoutes);
app.use('/api/v1/reviews', reviewRoutes);

app.use('/api/cms', cmsRoutes);
app.use('/api/v1/cms', cmsRoutes);

const ruleEngineRoutes = require('./routes/ruleEngineRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const featureFlagRoutes = require('./routes/featureFlagRoutes');
const scheduledChangeRoutes = require('./routes/scheduledChangeRoutes');
const serviceAreaRoutes = require('./routes/serviceAreaRoutes');
const reconciliationRoutes = require('./routes/reconciliationRoutes');

app.use('/api/rules', ruleEngineRoutes);
app.use('/api/v1/rules', ruleEngineRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/feature-flags', featureFlagRoutes);
app.use('/api/v1/feature-flags', featureFlagRoutes);
app.use('/api/scheduled-changes', scheduledChangeRoutes);
app.use('/api/v1/scheduled-changes', scheduledChangeRoutes);
app.use('/api/service-areas', serviceAreaRoutes);
app.use('/api/v1/service-areas', serviceAreaRoutes);
app.use('/api/reconciliations', reconciliationRoutes);
app.use('/api/v1/reconciliations', reconciliationRoutes);

app.use('/api/training', trainingRoutes);
app.use('/api/v1/training', trainingRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/', (req, res) => {
  res.send('Food Delivery API is running...');
});
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://127.0.0.1:${PORT}`);
  console.log(`Socket.IO server ready for real-time connections`);
});

const InitializeConnection = async () => {
  try {
    await connectDB();
    if (require('mongoose').connection.readyState === 1) {
      initCronJobs();
      initPaymentCronJobs();
    } else {
      console.log('⚡ Standalone API Mode: Crons paused until live DB connection.');
    }
  } catch (err) {
    console.log("error occured " + err);
  }
};
InitializeConnection();
