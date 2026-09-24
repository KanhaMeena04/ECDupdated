const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getCart, 
  addToCart, 
  removeItem, 
  updateItemQuantity, 
  clearCart,
  updateCartMeta, 
  validateCoupon 
} = require('../controllers/cartController');

router.get('/', protect, getCart);

// Add to cart
router.post('/add', protect, addToCart);
router.post('/item', protect, addToCart);

// Update quantity
router.put('/update', protect, updateItemQuantity);
router.patch('/item/:itemId/quantity', protect, updateItemQuantity);

// Remove item
router.delete('/remove', protect, removeItem);
router.delete('/item/:itemId', protect, removeItem);

// Clear cart
router.delete('/clear', protect, clearCart);

// Metadata & coupon
router.put('/meta', protect, updateCartMeta);
router.post('/validate-coupon', protect, validateCoupon);

module.exports = router;

