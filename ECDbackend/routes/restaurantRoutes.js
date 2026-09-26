const express = require('express');
const router = express.Router();
const { protect, optionalAuth, admin, restaurantOwner } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');
const { getMenu } = require('../controllers/menuController');
const {
  getAllRestaurants,
  getRestaurantById,
  applyForRestaurant,
  adminCreateRestaurant,
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
  updateRestaurant,
  requestRestaurantProfileUpdate,
  verifyRestaurantProfileUpdate,
  getAllRestaurantsForAdmin,
  getAllRestaurantsNameForAdmin,
  deleteRestaurant,
  getActiveRestaurantsForAdmin,
  toggleFavorite,
  updateDocuments,
  updateBankDetails,
  getMyRestaurant,
  getDashboard,
  getAnalyticsDashboard,
  updateSettings,
  financeSummary,
  bestSellers,
  settlementReport,
  getOrderInvoice,
  verifyRestaurantDocuments,
  getAllApprovedRestaurantsForAdmin,
  getRestaurantProductById,
  getRestaurantByIdAdmin,
  getRestaurantWalletEarnings,
  vendorSendOtp,
  vendorVerifyOtp,
  vendorLoginWithPin,
  adminSetVendorPin,
  getRestaurantStatusCheck,
  getRestaurantProfileById,
  toggleRestaurantActive,
  vendorAddMenuItem,
  vendorBulkImportMenuItems,
  vendorEditMenuItem,
  vendorToggleMenuItem,
  vendorDeleteMenuItem,
  getOrderHistory,
  getDashboardStats,
  deleteAccount
} = require('../controllers/restaurantController');
const {
  createOwnerPromocode,
  getOwnerPromocodes,
  getOwnerPromocodeById,
  updateOwnerPromocode,
  deleteOwnerPromocode
} = require('../controllers/promocodeController');

router.get('/', getAllRestaurants);
router.get('/list', getAllRestaurants);
router.get('/menu/:restaurantId', optionalAuth, getMenu);
router.get('/status/check', getRestaurantStatusCheck);
router.get('/:id/status', getRestaurantStatusCheck);
router.post('/send-otp', vendorSendOtp);
router.post('/verify-otp', vendorVerifyOtp);
router.post('/login-with-pin', vendorLoginWithPin);
router.post('/vendor/login-with-pin', vendorLoginWithPin);
router.get('/profile', protect, restaurantOwner, getMyRestaurant);
router.get('/:id/profile', protect, getRestaurantProfileById);
router.get('/:id/order-history', protect, getOrderHistory);
router.get('/:id/dashboard-stats', protect, getDashboardStats);
router.post('/vendor/delete-account', protect, deleteAccount);
router.put('/:id/toggle-active', protect, toggleRestaurantActive);
router.post('/vendor/menu/add/:id', optionalAuth, vendorAddMenuItem);
router.post('/vendor/menu/bulk-import/:id', optionalAuth, vendorBulkImportMenuItems);
router.put('/vendor/menu/edit/:restId/:itemId', optionalAuth, vendorEditMenuItem);
router.put('/:restId/menu/:itemId', optionalAuth, vendorEditMenuItem);
router.patch('/vendor/menu/toggle/:restId/:itemId', optionalAuth, vendorToggleMenuItem);
router.post('/:restId/menu/:itemId/request-delete', optionalAuth, vendorDeleteMenuItem);
router.delete('/:restId/menu/:itemId', optionalAuth, vendorDeleteMenuItem);
router.get('/:id/details', protect, getRestaurantProductById);
router.post('/apply', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'images', maxCount: 6 },
  { name: 'licenseFrontImage', maxCount: 1 },
  { name: 'licenseBackImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'gstImage', maxCount: 1 },
  { name: 'tradeLicenseImage', maxCount: 1 },
  { name: 'vatImage', maxCount: 1 }
]), applyForRestaurant);
router.get('/profile', protect, restaurantOwner, getMyRestaurant);
router.put('/:id', protect, restaurantOwner, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'images', maxCount: 6 }
]), updateRestaurant);
router.post('/:id/request-update', protect, restaurantOwner, requestRestaurantProfileUpdate);
router.post('/:id/verify-update', protect, restaurantOwner, verifyRestaurantProfileUpdate);
router.put('/:id/documents', protect, restaurantOwner, upload.fields([
  { name: 'licenseFrontImage', maxCount: 1 },
  { name: 'licenseBackImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'gstImage', maxCount: 1 },
  { name: 'tradeLicenseImage', maxCount: 1 },
  { name: 'vatImage', maxCount: 1 }
]), updateDocuments);
router.put('/:id/bank', protect, restaurantOwner, updateBankDetails);
router.get('/dashboard', protect, restaurantOwner, getDashboard);
router.get('/dashboard/analytics', protect, restaurantOwner, getAnalyticsDashboard);
router.put('/:id/settings', protect, restaurantOwner, updateSettings);
router.get('/finance/summary', protect, restaurantOwner, financeSummary);
router.get('/finance/wallet', protect, restaurantOwner, getRestaurantWalletEarnings);
router.get('/finance/bestsellers', protect, restaurantOwner, bestSellers);
router.get('/finance/settlement', protect, restaurantOwner, settlementReport);
router.get('/finance/order/:orderId/invoice', protect, restaurantOwner, getOrderInvoice);
router.post('/promocode', protect, restaurantOwner, upload.single('image'), createOwnerPromocode);
router.get('/promocode', protect, restaurantOwner, getOwnerPromocodes);
router.get('/promocode/:id', protect, restaurantOwner, getOwnerPromocodeById);
router.put('/promocode/:id', protect, restaurantOwner, upload.single('image'), updateOwnerPromocode);
router.delete('/promocode/:id', protect, restaurantOwner, deleteOwnerPromocode);
router.post('/admin/create', protect, admin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'images', maxCount: 6 },
  { name: 'licenseFrontImage', maxCount: 1 },
  { name: 'licenseBackImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'gstImage', maxCount: 1 },
  { name: 'tradeLicenseImage', maxCount: 1 },
  { name: 'vatImage', maxCount: 1 }
]), adminCreateRestaurant);
router.get('/admin/pending', protect, admin, getPendingRestaurants);
router.put('/admin/:id/bank', protect, admin, updateBankDetails);
router.put('/admin/:id', protect, admin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'images', maxCount: 6 }
]), updateRestaurant);
router.put('/admin/:id/documents', protect, admin, upload.fields([
  { name: 'licenseFrontImage', maxCount: 1 },
  { name: 'licenseBackImage', maxCount: 1 },
  { name: 'panImage', maxCount: 1 },
  { name: 'gstImage', maxCount: 1 },
  { name: 'tradeLicenseImage', maxCount: 1 },
  { name: 'vatImage', maxCount: 1 }
]), updateDocuments);
router.put('/admin/approve/:id', approveRestaurant);
router.put('/admin/reject/:id', rejectRestaurant);
router.put('/admin/:id/set-pin', adminSetVendorPin);
router.get('/admin/list', getAllRestaurantsForAdmin);
router.get('/admin/all', getAllRestaurantsForAdmin);
router.get('/admin/approvedlist', getAllApprovedRestaurantsForAdmin);
router.get('/admin/listName', getAllRestaurantsNameForAdmin);
router.get('/admin/list/active', getActiveRestaurantsForAdmin);
router.put('/admin/verify/:id', verifyRestaurantDocuments);
router.get('/admin/:id', getRestaurantByIdAdmin);
router.get('/details/:id', getRestaurantById);
router.get('/:id', getRestaurantById);
router.post('/:id/favorite', protect, toggleFavorite);
router.delete('/:id', deleteRestaurant);
module.exports = router;

