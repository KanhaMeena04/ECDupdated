const dotenv = require('dotenv');
dotenv.config();
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
  process.env.SOCKET_IO_CLIENT_URL,
  'https://demo-foodpanda-admin-panel.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000'
].filter(Boolean);

const corsConfig = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const extraOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
    if (
      allowedOrigins.includes(origin) ||
      extraOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    console.error(`CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
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
require('./sockets')(io);
const initCronJobs = require('./services/cronService');
initCronJobs();
const initPaymentCronJobs = require('./services/paymentCronJobs'); // NEW: weekly payout cron
initPaymentCronJobs();
app.use(cookieParser());
app.use(cors(corsConfig));
const { handleStripeWebhook } = require('./controllers/paymentController');
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json());
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

app.use('/api/orders', orderRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use('/api/riders', riderRoutes);
app.use('/api/v1/riders', riderRoutes);

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

app.use('/api/home', homeRoutes);
app.use('/api/v1/home', homeRoutes);

app.use('/api/cities', cityRoutes);
app.use('/api/v1/cities', cityRoutes);

app.use('/api/zones', zoneRoutes);
app.use('/api/v1/zones', zoneRoutes);

app.use('/api/food-quantities', foodQuantityRoutes);
app.use('/api/v1/food-quantities', foodQuantityRoutes);

app.use('/api/user', userRoutes);
app.use('/api/v1/user', userRoutes);

app.use('/api/wallet', walletRoutes);
app.use('/api/v1/wallet', walletRoutes);

app.use('/api/cart', cartRoutes);
app.use('/api/v1/cart', cartRoutes);

app.use('/api/incentives', incentiveRoutes);
app.use('/api/v1/incentives', incentiveRoutes);

app.use('/api/reviews', reviewRoutes);
app.use('/api/v1/reviews', reviewRoutes);

app.use('/api/cms', cmsRoutes);
app.use('/api/v1/cms', cmsRoutes);

app.use('/api/training', trainingRoutes);
app.use('/api/v1/training', trainingRoutes);
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/', (req, res) => {
  res.send('Food Delivery API is running...');
});
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";
const InitializeConnection = async () => {
  try {
    await Promise.resolve(connectDB());
    console.log("DB connect");
    server.listen(PORT, HOST, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Socket.IO server ready for real-time connections`);
      console.log(server.address());
    });
  }
  catch (err) {
    console.log("error occured " + err);
  }
}
InitializeConnection();
