const express = require('express');
const router = express.Router();
const { 
    registerInitiate, 
    registerVerify,
    checkVerificationStatus,
    resendOTP,
    loginUser, 
    logoutUser,
    forgotPasswordInitiate,
    resendForgotPasswordOTP,
    forgotPasswordVerifyOTP,
    resetPassword,
    driverSendOtp,
    driverVerifyOtp,
    driverLoginWithPin,
    driverRefreshToken
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register/initiate', registerInitiate);
router.post('/register/verify', registerVerify);
router.post('/check-verification-status', checkVerificationStatus);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPasswordInitiate);
router.post('/forgot-password/resend-otp', resendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOTP);
router.post('/reset-password', resetPassword);

// Driver / Rider Auth
router.post('/driver/send-otp', driverSendOtp);
router.post('/driver/verify-otp', driverVerifyOtp);
router.post('/driver/login-with-pin', driverLoginWithPin);
router.post('/driver/refresh-token', protect, driverRefreshToken);

module.exports = router;
