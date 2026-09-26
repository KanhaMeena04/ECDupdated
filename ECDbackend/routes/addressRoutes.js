const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/userController');

// User Address Routes
router.get('/me', protect, getAddresses);
router.get('/', protect, getAddresses);
router.post('/add', protect, addAddress);
router.post('/', protect, addAddress);
router.put('/update/:id', protect, updateAddress);
router.put('/:id', protect, updateAddress);
router.delete('/delete/:id', protect, deleteAddress);
router.delete('/:id', protect, deleteAddress);
router.patch('/set-default/:id', protect, setDefaultAddress);

module.exports = router;
