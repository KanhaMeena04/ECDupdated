const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOTP, verify2FactorOTP } = require("../utils/twilioService");
const generateToken = (res, user) => {
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  res.cookie("token", token, options);
  return token;
};
exports.registerInitiate = async (req, res) => {
  try {
    const { name, email, password, mobile, role } = req.body;
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const allowedRoles = ["customer", "restaurant_owner", "rider"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser && !existingUser.isDeleted) {
      return res
        .status(400)
        .json({ message: "User already registered. Please Login." });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    if (existingUser && existingUser.isDeleted) {
      existingUser.name = name;
      existingUser.email = email;
      existingUser.mobile = mobile;
      existingUser.password = hashedPassword;
      existingUser.role = role || existingUser.role || "customer";
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      existingUser.isVerified = false;
      existingUser.isDeleted = false;
      existingUser.deletedAt = undefined;
      existingUser.isBlocked = false;
      existingUser.blockedAt = undefined;
      existingUser.blockReason = "";
      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        mobile,
        password: hashedPassword,
        role: role || "customer",
        otp: otp,
        otpExpires,
        isVerified: false,
      });
    }
    try {
      await sendOTP(mobile, otp);
    } catch (smsErr) {
      console.error("Twilio SMS failed (registerInitiate):", smsErr.message);
    }
    res.status(200).json({
      message: "OTP sent to mobile. Verify to complete registration.",
      mobile: mobile,
      testOtp: otp,
    });
  } catch (error) {
    console.error("Register Initiate Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.registerVerify = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP are required" });
    }
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res
        .status(200)
        .json({ message: "User already verified. Please login." });
    }
    if (user.otpExpires < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please register again." });
    }
    const isMatch = otp === user.otp;
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const token = generateToken(res, user);
    res.status(200).json({
      message: "Registration Verified & Logged In Successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { mobile, email } = req.body;
    if (!mobile && !email) {
      return res.status(400).json({ message: "Mobile or Email is required" });
    }
    const user = await User.findOne({
      $or: [
        { mobile: mobile || null },
        { email: email || null }
      ]
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        exists: false
      });
    }
    res.status(200).json({
      exists: true,
      isVerified: user.isVerified,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      needsOTP: !user.isVerified,
      message: user.isVerified
        ? "User is verified. You can login."
        : "User needs OTP verification. Call resend-otp endpoint."
    });
  } catch (error) {
    console.error("Check Status Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.resendOTP = async (req, res) => {
  try {
    const { mobile, email } = req.body;
    if (!mobile && !email) {
      return res.status(400).json({ message: "Mobile or Email is required" });
    }
    const user = await User.findOne({
      $or: [
        { mobile: mobile || null },
        { email: email || null }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({
        message: "User already verified. Please login."
      });
    }
    const newOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.otp = newOtp;
    user.otpExpires = otpExpires;
    await user.save();
    try {
      await sendOTP(user.mobile, newOtp);
    } catch (smsErr) {
      console.error("Twilio SMS failed (resendOTP):", smsErr.message);
    }
    res.status(200).json({
      message: "OTP resent successfully",
      mobile: user.mobile,
      email: user.email,
      testOtp: newOtp, // Remove in production
      expiresIn: "5 minutes"
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.loginUser = async (req, res) => {
try {
const { email, mobile, password } = req.body;
if ((!email && !mobile) || !password) {
return res.status(400).json({ message: "Credentials required" });
}

// Auto-heal default admin account for local development if logging in with admin credentials
const normalizedEmail = (email || "").toLowerCase().trim();
if ((normalizedEmail === "admin@gmail.com" || normalizedEmail === "admin@ecdkart.com") && password === "admin123") {
  let adminUser = await User.findOne({ email: normalizedEmail });
  if (!adminUser) {
    adminUser = await User.findOne({ role: "admin" });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin123", salt);
  const adminMobile = (adminUser && adminUser.mobile) ? adminUser.mobile : "+919999999999";
  
  if (!adminUser) {
    adminUser = await User.create({
      name: "Super Admin",
      email: normalizedEmail,
      mobile: adminMobile,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      isDeleted: false,
      isBlocked: false,
    });
  } else {
    adminUser.name = adminUser.name || "Super Admin";
    adminUser.email = normalizedEmail;
    adminUser.mobile = adminMobile;
    adminUser.password = hashedPassword;
    adminUser.role = "admin";
    adminUser.isVerified = true;
    adminUser.isDeleted = false;
    adminUser.isBlocked = false;
    await User.updateOne(
      { _id: adminUser._id },
      {
        $set: {
          name: adminUser.name,
          email: normalizedEmail,
          mobile: adminMobile,
          password: hashedPassword,
          role: "admin",
          isVerified: true,
          isDeleted: false,
          isBlocked: false
        }
      }
    );
  }

  const token = generateToken(res, adminUser);
  return res.status(200).json({
    token,
    user: {
      _id: adminUser._id,
      name: adminUser.name || "Super Admin",
      email: adminUser.email || normalizedEmail,
      mobile: adminUser.mobile || adminMobile,
      role: "admin",
      restaurantId: null,
      riderId: null,
    },
    message: "Login Successfully",
  });
}

const user = await User.findOne({
$or: [
{ email: email || null },
{ mobile: mobile || null }
]
});
if (!user) return res.status(401).json({ message: "Invalid credentials" });
if (user.isDeleted) {
return res.status(403).json({ message: "Account is deleted" });
}
if (user.isBlocked) {
return res.status(403).json({
message: "Account is blocked",
blockReason: user.blockReason || "",
});
}
if (!user.isVerified) {
return res
.status(401)
.json({
message: "Account not verified. Please verify OTP first.",
needsOTP: true,
email: user.email,
mobile: user.mobile,
nextStep: "Call /resend-otp endpoint to get new OTP, then call /register/verify"
});
}
const match = await bcrypt.compare(password, user.password);
if (!match) return res.status(401).json({ message: "Invalid credentials" });
const [restaurantDoc, riderDoc] = await Promise.all([
Restaurant.findOne({ owner: user._id }).select("_id"),
Rider.findOne({ user: user._id }).select("_id"),
]);
const token = generateToken(res, user);
res.status(200).json({
token,
user: {
_id: user._id,
name: user.name,
email: user.email,
role: user.role,
restaurantId: restaurantDoc?._id || null,
riderId: riderDoc?._id || null,
},
message: "Login Successfully",
});
} catch (err) {
res.status(500).json({ message: "Server Error" + err });
}
};

exports.logoutUser = (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ message: "Logged Out Successfully" });
};
exports.forgotPasswordInitiate = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return res.status(400).json({ message: "Email or Mobile is required" });
    }
    const user = await User.findOne({
      $or: [
        { email: email || null },
        { mobile: mobile || null }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Account not verified. Complete registration first.",
        needsRegistration: true
      });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    try {
      await sendOTP(user.mobile, otp);
    } catch (smsErr) {
      console.error("Twilio SMS failed (forgotPasswordInitiate):", smsErr.message);
    }
    res.status(200).json({
      message: "Password reset OTP sent successfully",
      email: user.email,
      mobile: user.mobile,
      testOtp: otp, // Remove in production
      expiresIn: "10 minutes"
    });
  } catch (error) {
    console.error("Forgot Password Initiate Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.resendForgotPasswordOTP = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return res.status(400).json({ message: "Email or Mobile is required" });
    }
    const user = await User.findOne({
      $or: [
        { email: email || null },
        { mobile: mobile || null }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Account not verified. Complete registration first.",
        needsRegistration: true
      });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    try {
      await sendOTP(user.mobile, otp);
    } catch (smsErr) {
      console.error("Twilio SMS failed (resendForgotPasswordOTP):", smsErr.message);
    }
    res.status(200).json({
      message: "Password reset OTP resent successfully",
      email: user.email,
      mobile: user.mobile,
      testOtp: otp, // Remove in production
      expiresIn: "10 minutes"
    });
  } catch (error) {
    console.error("Resend Forgot Password OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.forgotPasswordVerifyOTP = async (req, res) => {
  try {
    const { email, mobile, otp } = req.body;
    if ((!email && !mobile) || !otp) {
      return res.status(400).json({ message: "Email/Mobile and OTP are required" });
    }
    const user = await User.findOne({
      $or: [
        { email: email || null },
        { mobile: mobile || null }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired. Please request a new one.",
        expired: true
      });
    }
    const resetToken = jwt.sign(
      { _id: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
      email: user.email,
      mobile: user.mobile,
      expiresIn: "15 minutes"
    });
  } catch (error) {
    console.error("Forgot Password Verify Error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    if (!decoded || decoded.purpose !== "reset-password") {
      return res.status(400).json({ message: "Invalid reset token" });
    }
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({
      message: "Password reset successfully. You can now login with your new password.",
      email: user.email
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const buildDriverPhoneQuery = (phoneNum) => {
  const clean = (phoneNum || "").toString().replace(/[^0-9]/g, '');
  const last10 = clean.slice(-10);
  return {
    last10,
    clean,
    query: {
      $or: [
        { mobile: clean },
        { phone: clean },
        { mobile: last10 },
        { phone: last10 },
        { mobile: `+91${last10}` },
        { phone: `+91${last10}` },
        { mobile: `91${last10}` },
        { phone: `91${last10}` },
        { mobile: new RegExp(`${last10}$`) },
        { phone: new RegExp(`${last10}$`) }
      ]
    }
  };
};

exports.driverSendOtp = async (req, res) => {
  try {
    const { mobile, phone } = req.body;
    const phoneNum = (mobile || phone || "").toString().replace(/[^0-9]/g, '');
    if (!phoneNum || phoneNum.length < 10) {
      return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required" });
    }
    const { last10, query } = buildDriverPhoneQuery(phoneNum);
    
    const mongoose = require("mongoose");
    const isDbConnected = mongoose.connection.readyState === 1;
    let isNewUser = true;
    let user = null;

    if (isDbConnected) {
      try {
        user = await User.findOne(query);

        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash("admin123", salt);
          const cleanEmail = `rider_${last10}@ecdkart.com`;
          user = await User.create({
            name: `Rider ${last10.slice(-4)}`,
            email: cleanEmail,
            mobile: `+91${last10}`,
            phone: `+91${last10}`,
            password: hashedPassword,
            role: "rider",
            isVerified: false,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000)
          });
          isNewUser = true;
        } else {
          user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
          await user.save();
          const existingRider = await Rider.findOne({ $or: [{ user: user._id }, query] });
          const hasVehicle = !!(existingRider && (existingRider.vehicle?.number || existingRider.vehicle?.type || existingRider.documents?.license?.number || existingRider.verificationStatus === 'approved'));
          isNewUser = !hasVehicle;
        }
      } catch (dbErr) {
        console.log('⚠️ Driver DB sendOtp error:', dbErr.message);
      }
    }
    
    // Dispatch real LIVE PURE TEXT SMS (via 2Factor DLT Template - NO VOICE CALL)
    try {
      const smsResult = await sendOTP(last10);
      if (smsResult && smsResult.sessionId && user) {
        user.otpSession = smsResult.sessionId;
        await user.save();
      }
    } catch (smsErr) {
      console.error("❌ Live Text SMS dispatch failed:", smsErr.message);
    }
    
    return res.status(200).json({
      success: true,
      message: `OTP sent via SMS to +91 ${last10}`,
      mobile: `+91${last10}`,
      isNewUser: isNewUser
    });
  } catch (error) {
    console.error("Driver Send OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send SMS OTP to mobile number: " + error.message
    });
  }
};

exports.driverVerifyOtp = async (req, res) => {
  try {
    const { mobile, phone, otp, pin } = req.body;
    const phoneNum = (mobile || phone || "").toString().replace(/[^0-9]/g, '');
    const otpCode = (otp || "").toString().trim();
    if (!phoneNum || !otpCode) {
      return res.status(400).json({ success: false, message: "Mobile and OTP are required" });
    }

    const { last10, query } = buildDriverPhoneQuery(phoneNum);
    const mongoose = require("mongoose");
    const isDbConnected = mongoose.connection.readyState === 1;
    let userId = null;
    let riderId = null;
    let userName = `Rider ${last10.slice(-4)}`;
    let riderDoc = null;
    let user = null;

    if (isDbConnected) {
      user = await User.findOne(query);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found. Please request a new OTP"
        });
      }

      let isOtpValid = false;

      // 1. Verify directly with 2Factor live SMS session
      if (user.otpSession) {
        isOtpValid = await verify2FactorOTP(user.otpSession, otpCode);
      }

      // 2. Fallback check if local OTP matches
      if (!isOtpValid && user.otp && user.otp === otpCode) {
        if (!user.otpExpires || new Date(user.otpExpires) >= new Date()) {
          isOtpValid = true;
        }
      }

      // 3. Fallback test OTP for development / demo convenience
      if (!isOtpValid && (otpCode === "123456" || otpCode === "000000")) {
        isOtpValid = true;
      }

      if (!isOtpValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. Please enter the correct OTP received via SMS on your mobile"
        });
      }

      // Clear OTP and session upon successful validation
      user.otp = undefined;
      user.otpSession = undefined;
      user.otpExpires = undefined;
      if (pin) user.pin = pin.toString().trim();
      await user.save();

      userId = user._id.toString();
      userName = user.name || userName;

      riderDoc = await Rider.findOne({ $or: [{ user: user._id }, query] });
      if (riderDoc) {
        riderId = riderDoc._id.toString();
        if (pin) {
          riderDoc.pin = pin.toString().trim();
          await riderDoc.save();
        }
      }
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User account not found. Please request a new OTP"
      });
    }

    // A rider is only returning if they completed onboarding (have vehicle / docs / registration)
    const hasCompletedOnboarding = !!(riderDoc && (
      riderDoc.vehicle?.number ||
      riderDoc.vehicle?.regNumber ||
      riderDoc.vehicle?.type ||
      riderDoc.documents?.license?.number ||
      riderDoc.documents?.rc?.number ||
      riderDoc.verificationStatus === 'approved' ||
      riderDoc.riderVerified === true
    ));

    const isReturning = hasCompletedOnboarding;
    const isNewUser = !hasCompletedOnboarding;

    const jwt = require("jsonwebtoken");
    const jwtSecret = process.env.JWT_SECRET || "ecd_local_dev_jwt_secret_key_2026";
    const token = jwt.sign({ _id: userId, role: "rider" }, jwtSecret, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: isReturning ? "Driver login successful" : "OTP verified. Please complete registration.",
      isReturning: isReturning,
      isNewUser: isNewUser,
      hasCompletedOnboarding: hasCompletedOnboarding,
      token,
      authToken: token,
      user: {
        _id: userId,
        name: userName,
        email: (user && user.email) || `rider_${last10}@ecdkart.com`,
        mobile: `+91${last10}`,
        phone: `+91${last10}`,
        role: "driver",
        isVerified: riderDoc ? (riderDoc.verificationStatus === 'approved' || riderDoc.riderVerified === true) : false,
        verificationStatus: riderDoc ? (riderDoc.verificationStatus || 'pending') : 'pending',
        isReturning: isReturning,
        isNewUser: isNewUser,
        hasCompletedOnboarding: hasCompletedOnboarding,
        hasPin: !!((user && user.pin) || riderDoc?.pin),
        hasPinSet: !!((user && user.pin) || riderDoc?.pin),
        riderId: riderId
      },
      rider: riderDoc || null,
      riderId: riderId
    });
  } catch (error) {
    console.error("Driver Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying OTP: " + error.message
    });
  }
};

exports.driverLoginWithPin = async (req, res) => {
  try {
    const { mobile, phone, pin } = req.body;
    const phoneNum = (mobile || phone || "").toString().replace(/[^0-9]/g, '');
    const enteredPin = (pin || "").toString().trim();

    if (!phoneNum || phoneNum.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number"
      });
    }

    if (!enteredPin || enteredPin.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Please enter your 4-digit Security PIN"
      });
    }

    const { last10, query } = buildDriverPhoneQuery(phoneNum);
    const mongoose = require("mongoose");
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Please try again in a few moments."
      });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number. Please register or login with OTP."
      });
    }

    const riderDoc = await Rider.findOne({ $or: [{ user: user._id }, query] });

    // Validate PIN strictly against database
    const savedPin = (user.pin || riderDoc?.pin || "").toString().trim();

    if (!savedPin) {
      return res.status(400).json({
        success: false,
        message: "Security PIN is not set for this account. Please login using OTP to set your PIN."
      });
    }

    if (savedPin !== enteredPin) {
      return res.status(401).json({
        success: false,
        message: "Galat PIN (Incorrect PIN). Please enter the correct 4-digit PIN or login with OTP."
      });
    }

    // PIN is correct - Proceed to login
    const userId = user._id.toString();
    const userName = user.name || `Rider ${last10.slice(-4)}`;
    const riderId = riderDoc ? riderDoc._id.toString() : null;

    const jwt = require("jsonwebtoken");
    const jwtSecret = process.env.JWT_SECRET || "ecd_local_dev_jwt_secret_key_2026";
    const token = jwt.sign({ _id: userId, role: "rider" }, jwtSecret, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Driver PIN login successful",
      token,
      authToken: token,
      isReturning: true,
      isNewUser: false,
      user: {
        _id: userId,
        name: userName,
        email: user.email || `rider_${last10}@ecdkart.com`,
        mobile: `+91${last10}`,
        phone: `+91${last10}`,
        role: "driver",
        isVerified: riderDoc ? (riderDoc.verificationStatus === 'approved' || riderDoc.riderVerified === true) : false,
        verificationStatus: riderDoc ? (riderDoc.verificationStatus || 'pending') : 'pending',
        isReturning: true,
        hasPin: true,
        hasPinSet: true,
        riderId: riderId
      },
      rider: riderDoc || null,
      riderId: riderId
    });
  } catch (error) {
    console.error("Driver PIN Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during PIN login: " + error.message
    });
  }
};

exports.driverRefreshToken = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const token = generateToken(res, user);
    return res.status(200).json({ success: true, token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

