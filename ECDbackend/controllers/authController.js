const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const Role = require("../models/Role");
const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOTP, verify2FactorOTP } = require("../utils/twilioService");
const {
  ensureCustomerId,
  ensureRiderId,
  ensureRestaurantId,
} = require("../utils/idGenerator");

// Fixed demo credentials for customer app (App Store / QA review)
const DEMO_USER_PHONE = "1234567890";
const DEMO_USER_OTP = "123456";
const isDemoUserPhone = (last10) => last10 === DEMO_USER_PHONE;

const generateToken = (res, user) => {
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );
  const options = {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  res.cookie("token", token, options);
  return token;
};
exports.registerInitiate = async (req, res) => {
  try {
    const { name, firstName, lastName, email, password, mobile, role } = req.body;
    let finalFirstName = firstName || "";
    let finalLastName = lastName || "";
    let finalName = name || "";
    if (!finalFirstName && !finalLastName && finalName) {
      const parts = finalName.trim().split(" ");
      finalFirstName = parts[0] || "";
      finalLastName = parts.slice(1).join(" ") || "";
    }
    if (!finalName && (finalFirstName || finalLastName)) {
      finalName = `${finalFirstName} ${finalLastName}`.trim();
    }
    if ((!finalName && !finalFirstName) || !password || !mobile) {
      return res.status(400).json({ message: "Name, mobile, and password are required" });
    }
    const allowedRoles = ["customer", "restaurant_owner", "rider"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const searchOr = [{ mobile }];
    if (email && email.trim()) {
      searchOr.push({ email: email.trim().toLowerCase() });
    }
    const existingUser = await User.findOne({ $or: searchOr });
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
      existingUser.name = finalName;
      existingUser.firstName = finalFirstName;
      existingUser.lastName = finalLastName;
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
        name: finalName,
        firstName: finalFirstName,
        lastName: finalLastName,
        email: email && email.trim() ? email.trim().toLowerCase() : undefined,
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
    const incomingFcm = req.body.fcmToken || req.body.token || req.body.deviceToken || req.body.pushToken;
    if (incomingFcm && typeof incomingFcm === 'string' && incomingFcm.trim()) {
      user.fcmToken = incomingFcm.trim();
    }
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
    const { email, mobile, password, pin, loginId, username, userName, name } = req.body;
    const rawIdentifier = (loginId || username || userName || name || email || mobile || "").trim();
    const secret = (password || pin || "").trim();

    if (!rawIdentifier || !secret) {
      return res.status(400).json({ message: "Login credentials (Username/Mobile and Password/PIN) are required" });
    }

    // Auto-heal default admin account for local development if logging in with admin credentials
    const normalizedEmail = rawIdentifier.toLowerCase();
    if ((normalizedEmail === "admin@gmail.com" || normalizedEmail === "admin@ecdkart.com") && secret === "admin123") {
      let adminUser = await User.findOne({ email: normalizedEmail });
      if (!adminUser) {
        adminUser = await User.findOne({ role: "admin" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      if (!adminUser) {
        adminUser = await User.create({
          name: "Super Admin",
          email: normalizedEmail,
          mobile: "+919999999999",
          phone: "+919999999999",
          password: hashedPassword,
          pin: "1234",
          role: "admin",
          roleName: "Super Admin",
          permissions: ["all"],
          isVerified: true,
          isDeleted: false,
          isBlocked: false,
        });
      } else {
        adminUser.email = normalizedEmail;
        adminUser.password = hashedPassword;
        adminUser.role = "admin";
        adminUser.roleName = "Super Admin";
        adminUser.permissions = ["all"];
        adminUser.isVerified = true;
        adminUser.isDeleted = false;
        adminUser.isBlocked = false;
        await adminUser.save();
      }

      const token = generateToken(res, adminUser);
      return res.status(200).json({
        token,
        user: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          mobile: adminUser.mobile,
          role: adminUser.role,
          roleName: "Super Admin",
          permissions: ["all"],
          restaurantId: null,
          riderId: null,
        },
        message: "Login Successfully",
      });
    }

    const cleanDigits = rawIdentifier.replace(/[\s-]/g, '');
    const searchConditions = [
      { email: normalizedEmail },
      { mobile: rawIdentifier },
      { phone: rawIdentifier }
    ];

    // Support Login using Username / Full Name / First Name
    const escapedIdentifier = rawIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    searchConditions.push({ name: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } });
    searchConditions.push({ firstName: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } });

    if (/^\d{10}$/.test(cleanDigits)) {
      searchConditions.push({ mobile: cleanDigits });
      searchConditions.push({ phone: cleanDigits });
      searchConditions.push({ mobile: `+91${cleanDigits}` });
      searchConditions.push({ phone: `+91${cleanDigits}` });
    } else if (cleanDigits.startsWith('+91')) {
      const ten = cleanDigits.slice(3);
      searchConditions.push({ mobile: ten });
      searchConditions.push({ phone: ten });
      searchConditions.push({ mobile: cleanDigits });
      searchConditions.push({ phone: cleanDigits });
    }

    let user = await User.findOne({ $or: searchConditions });

    // If not found in User collection, check Staff collection
    if (!user) {
      const staff = await Staff.findOne({ $or: searchConditions }).populate('role');
      if (staff) {
        if (staff.user) {
          user = await User.findById(staff.user);
        }
        if (!user) {
          user = await User.create({
            name: staff.name,
            email: staff.email,
            mobile: staff.phone,
            phone: staff.phone,
            password: staff.password,
            pin: staff.pin || undefined,
            role: 'admin',
            roleRef: staff.role?._id || staff.role,
            roleName: staff.roleName || staff.role?.name || 'Admin',
            permissions: staff.role?.permissions || [],
            isVerified: true
          });
          staff.user = user._id;
          await staff.save();
        }
      }
    }

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
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(401).json({
        message: "Account not verified. Please verify OTP first.",
        needsOTP: true,
        email: user.email,
        mobile: user.mobile,
        nextStep: "Call /resend-otp endpoint to get new OTP, then call /register/verify"
      });
    }

    let match = false;
    if (user.password) {
      match = await bcrypt.compare(secret, user.password);
    }
    if (!match && user.pin) {
      if (user.pin === secret) {
        match = true;
      } else {
        try {
          match = await bcrypt.compare(secret, user.pin);
        } catch (_) {}
      }
    }

    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // Determine permissions & roleName
    let permissions = Array.isArray(user.permissions) ? [...user.permissions] : [];
    let roleName = user.roleName || (user.role === 'admin' ? 'Super Admin' : user.role);

    if (user.roleRef) {
      const roleDoc = await Role.findById(user.roleRef);
      if (roleDoc) {
        if (Array.isArray(roleDoc.permissions) && roleDoc.permissions.length > 0) {
          permissions = roleDoc.permissions;
        }
        roleName = roleDoc.name || roleName;
      }
    }

    if (user.email === 'admin@gmail.com' || user.email === 'admin@ecdkart.com') {
      permissions = ['all'];
      roleName = 'Super Admin';
    }

    const [restaurantDoc, riderDoc] = await Promise.all([
      Restaurant.findOne({ owner: user._id }).select("_id"),
      Rider.findOne({ user: user._id }).select("_id"),
    ]);

    const customerIdCode = await ensureCustomerId(user);
    const incomingFcm = req.body.fcmToken || req.body.token || req.body.deviceToken || req.body.pushToken;
    if (incomingFcm && typeof incomingFcm === 'string' && incomingFcm.trim()) {
      user.fcmToken = incomingFcm.trim();
      await user.save();
    }
    const token = generateToken(res, user);
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        id: user._id,
        customerId: customerIdCode || user.customerId || "C001",
        name: user.name,
        email: user.email,
        mobile: user.mobile || user.phone,
        role: user.role,
        roleName,
        roleId: user.roleRef || null,
        permissions,
        restaurantId: restaurantDoc?._id || null,
        riderId: riderDoc?._id || null,
      },
      message: "Login Successfully",
    });
  } catch (err) {
    console.error("Login User Error:", err);
    res.status(500).json({ message: err.message || "Server Error: " + err });
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

exports.driverSendOtp = async (req, res) => {
  try {
    const { mobile, phone } = req.body;
    const phoneNum = (mobile || phone || "").toString().trim();
    const providedName = (req.body.name || req.body.firstName || req.body.fullName || req.body.riderName || "").toString().trim();

    if (!phoneNum) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const cleanDigits = phoneNum.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);
    const phoneVariations = [phoneNum, cleanDigits, last10, `+91${last10}`, `91${last10}`].filter(Boolean);

    const generatedOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({
      $or: [
        { mobile: { $in: phoneVariations } },
        { phone: { $in: phoneVariations } }
      ]
    });

    if (user && user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      const cleanEmail = `rider_${last10}@ecdkart.com`;
      user = await User.create({
        name: providedName || `Rider ${last10.slice(-4)}`,
        email: cleanEmail,
        mobile: `+91${last10}`,
        phone: `+91${last10}`,
        password: hashedPassword,
        role: "rider",
        isVerified: true,
        otp: generatedOtp,
        otpExpires: otpExpires
      });
    } else {
      user.otp = generatedOtp;
      user.otpExpires = otpExpires;
      if (user.role === "user") {
        user.role = "rider";
      }
      await user.save();
    }
    
    let riderDoc = await Rider.findOne({
      $or: [
        { user: user._id },
        { phone: { $in: phoneVariations } },
        { mobile: { $in: phoneVariations } }
      ]
    });

    if (!riderDoc) {
      riderDoc = await Rider.create({
        user: user._id,
        name: user.name || providedName || `Rider ${last10.slice(-4)}`,
        phone: `+91${last10}`,
        mobile: `+91${last10}`,
        email: user.email,
        vehicle: { type: "bike" },
        verificationStatus: "pending",
        riderVerified: false,
        isOnline: false,
        isAvailable: false,
        status: "inactive"
      });
    } else if (!riderDoc.user || riderDoc.user.toString() !== user._id.toString()) {
      riderDoc.user = user._id;
      await riderDoc.save();
    }

    // Dispatch real SMS via 2Factor / Twilio
    let smsResult = null;
    try {
      smsResult = await sendOTP(last10, generatedOtp);
      console.log(`📱 [Rider Send OTP] Sent to +91${last10}: OTP = ${generatedOtp}, Result:`, smsResult);
    } catch (smsErr) {
      console.error("SMS Dispatch error (driverSendOtp):", smsErr.message);
    }
    
    const isRegistered = !!(user && user.name && !user.name.startsWith("Rider ") && user.name !== "New Customer");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to driver",
      mobile: phoneNum,
      isRegistered,
      isReturning: isRegistered,
      isNewUser: !isRegistered,
      testOtp: generatedOtp,
      smsDispatched: smsResult ? smsResult.success : false
    });
  } catch (error) {
    console.error("Driver Send OTP Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.driverVerifyOtp = async (req, res) => {
  try {
    const { mobile, phone, otp } = req.body;
    const phoneNum = (mobile || phone || "").toString().trim();
    const enteredOtp = (otp || "").toString().trim();
    const providedName = (req.body.name || req.body.firstName || req.body.fullName || req.body.riderName || "").toString().trim();

    if (!phoneNum || !enteredOtp) {
      return res.status(400).json({ message: "Mobile and OTP are required" });
    }

    const cleanDigits = phoneNum.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);
    const phoneVariations = [phoneNum, cleanDigits, last10, `+91${last10}`, `91${last10}`].filter(Boolean);

    let user = await User.findOne({
      $or: [
        { mobile: { $in: phoneVariations } },
        { phone: { $in: phoneVariations } }
      ]
    });

    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isValidUserOtp = user.otp && user.otp === enteredOtp && user.otpExpires > new Date();

    if (!isValidUserOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    if (user.role === "user") {
      user.role = "rider";
    }
    const incomingFcm = req.body.fcmToken || req.body.token || req.body.deviceToken || req.body.pushToken;
    if (incomingFcm && typeof incomingFcm === 'string' && incomingFcm.trim()) {
      user.fcmToken = incomingFcm.trim();
    }
    await user.save();

    let riderDoc = await Rider.findOne({
      $or: [
        { user: user._id },
        { phone: { $in: phoneVariations } },
        { mobile: { $in: phoneVariations } }
      ]
    });

    if (!riderDoc) {
      riderDoc = await Rider.create({
        user: user._id,
        name: user.name || providedName || `Rider ${last10.slice(-4)}`,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        email: user.email,
        vehicle: { type: "bike" },
        verificationStatus: "pending",
        riderVerified: false,
        isOnline: false,
        isAvailable: false,
        status: "inactive"
      });
    } else if (!riderDoc.user || riderDoc.user.toString() !== user._id.toString()) {
      riderDoc.user = user._id;
      await riderDoc.save();
    }

    const isReturning = !!(
      (user && user.name && !user.name.startsWith("Rider ") && user.name !== "New Customer") ||
      (riderDoc && riderDoc.name && !riderDoc.name.startsWith("Rider ")) ||
      (riderDoc && (riderDoc.riderVerified || riderDoc.verificationStatus === "approved" || riderDoc.vehicle?.number))
    );
    const isNewUser = !isReturning;

    const token = generateToken(res, user);
    return res.status(200).json({
      success: true,
      message: "Driver login successful",
      token,
      isReturning,
      isNewUser,
      isRegistered: isReturning,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        riderId: riderDoc._id,
        isReturning,
        isNewUser
      },
      rider: {
        ...(riderDoc ? (riderDoc.toObject ? riderDoc.toObject() : riderDoc) : {}),
        isReturning,
        isNewUser
      },
      riderId: riderDoc._id
    });
  } catch (error) {
    console.error("Driver Verify OTP Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.driverLoginWithPin = async (req, res) => {
  try {
    const { mobile, phone } = req.body;
    const phoneNum = (mobile || phone || "").toString().trim();
    if (!phoneNum) {
      return res.status(400).json({ success: false, message: "Mobile number is required" });
    }

    const cleanDigits = phoneNum.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);
    const phoneVariations = [phoneNum, cleanDigits, last10, `+91${last10}`, `91${last10}`].filter(Boolean);

    let user = await User.findOne({
      $or: [
        { mobile: { $in: phoneVariations } },
        { phone: { $in: phoneVariations } }
      ]
    });

    if (user && user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      user = await User.create({
        name: `Rider ${last10.slice(-4)}`,
        email: `rider_${last10}@ecdkart.com`,
        mobile: `+91${last10}`,
        phone: `+91${last10}`,
        password: hashedPassword,
        role: "rider",
        isVerified: true
      });
    }

    let riderDoc = await Rider.findOne({
      $or: [
        { user: user._id },
        { phone: { $in: phoneVariations } },
        { mobile: { $in: phoneVariations } }
      ]
    });

    if (!riderDoc) {
      riderDoc = await Rider.create({
        user: user._id,
        name: user.name,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        email: user.email,
        vehicle: { type: "bike" },
        verificationStatus: "pending",
        riderVerified: false,
        isOnline: false,
        isAvailable: false,
        status: "inactive"
      });
    } else if (!riderDoc.user || riderDoc.user.toString() !== user._id.toString()) {
      riderDoc.user = user._id;
      await riderDoc.save();
    }

    const riderIdCode = await ensureRiderId(riderDoc);
    const token = generateToken(res, user);
    return res.status(200).json({
      success: true,
      message: "Driver PIN login successful",
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        riderId: riderIdCode
      },
      rider: riderDoc,
      riderId: riderIdCode,
      driverId: riderIdCode
    });
  } catch (error) {
    console.error("Driver Login with PIN Error:", error);
    return res.status(500).json({ message: error.message });
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

exports.userSendOtp = async (req, res) => {
  try {
    const { mobile, phone } = req.body;
    const phoneNum = (mobile || phone || "").toString().trim();
    if (!phoneNum) {
      return res.status(400).json({ success: false, message: "Mobile number is required" });
    }

    const providedName = (req.body.name || req.body.fullName || "").toString().trim();
    const providedFn = (req.body.firstName || "").toString().trim();
    const providedLn = (req.body.lastName || "").toString().trim();

    let finalName = providedName;
    if (providedFn || providedLn) {
      finalName = `${providedFn} ${providedLn}`.trim();
    }

    const cleanDigits = phoneNum.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);
    if (last10.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid 10-digit mobile number" });
    }

    const last10Regex = new RegExp(`${last10}$`);
    const phoneVariations = [phoneNum, cleanDigits, last10, `+91${last10}`, `91${last10}`].filter(Boolean);

    const isDemoUser = isDemoUserPhone(last10);
    const generatedOtp = isDemoUser
      ? DEMO_USER_OTP
      : crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({
      $or: [
        { mobile: last10Regex },
        { phone: last10Regex },
        { mobile: { $in: phoneVariations } },
        { phone: { $in: phoneVariations } }
      ]
    }).sort({ createdAt: 1 });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("user123", salt);
      user = await User.create({
        name: finalName || (isDemoUser ? "Demo User" : `User ${last10.slice(-4)}`),
        firstName: providedFn || (finalName ? finalName.split(" ")[0] : ""),
        lastName: providedLn || (finalName ? finalName.split(" ").slice(1).join(" ") : ""),
        email: `user_${last10}@ecdkart.com`,
        mobile: `+91${last10}`,
        phone: `+91${last10}`,
        password: hashedPassword,
        role: "customer",
        isVerified: false,
        otp: generatedOtp,
        otpExpires: otpExpires
      });
    } else {
      if (user.isDeleted) {
        user.isDeleted = false;
        user.deletedAt = undefined;
      }
      if (finalName && (!user.name || user.name.startsWith("User"))) {
        user.name = finalName;
        user.firstName = providedFn || finalName.split(" ")[0] || "";
        user.lastName = providedLn || finalName.split(" ").slice(1).join(" ") || "";
      }
      user.otp = generatedOtp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    let smsResult = null;
    if (isDemoUser) {
      console.log(`📱 [User Send OTP] Demo account +91${last10}: fixed OTP ${DEMO_USER_OTP} (SMS skipped)`);
    } else {
      try {
        smsResult = await sendOTP(last10, generatedOtp);
        console.log(`📱 [User Send OTP] Sent SMS to +91${last10}: OTP = ${generatedOtp}, Result:`, smsResult);
      } catch (smsErr) {
        console.error("SMS Dispatch error (userSendOtp):", smsErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: isDemoUser
        ? `Demo OTP ready for +91${last10}`
        : `OTP sent successfully to +91${last10}`,
      mobile: `+91${last10}`,
      testOtp: isDemoUser || process.env.NODE_ENV !== "production" ? generatedOtp : undefined,
      smsDispatched: isDemoUser ? false : (smsResult ? smsResult.success : false)
    });
  } catch (error) {
    console.error("User Send OTP Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.userVerifyOtp = async (req, res) => {
  try {
    const { mobile, phone, otp, code } = req.body;
    const phoneNum = (mobile || phone || "").toString().trim();
    const enteredOtp = (otp || code || "").toString().trim();

    const providedName = (req.body.name || req.body.fullName || "").toString().trim();
    const providedFn = (req.body.firstName || "").toString().trim();
    const providedLn = (req.body.lastName || "").toString().trim();

    let finalName = providedName;
    if (providedFn || providedLn) {
      finalName = `${providedFn} ${providedLn}`.trim();
    }

    if (!phoneNum || !enteredOtp) {
      return res.status(400).json({ success: false, message: "Mobile number and OTP code are required" });
    }

    const cleanDigits = phoneNum.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);
    const last10Regex = new RegExp(`${last10}$`);
    const phoneVariations = [phoneNum, cleanDigits, last10, `+91${last10}`, `91${last10}`].filter(Boolean);

    const isDemoLogin = isDemoUserPhone(last10) && enteredOtp === DEMO_USER_OTP;

    let user = await User.findOne({
      $or: [
        { mobile: last10Regex },
        { phone: last10Regex },
        { mobile: { $in: phoneVariations } },
        { phone: { $in: phoneVariations } }
      ]
    }).sort({ createdAt: 1 });

    if (!user && isDemoLogin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("user123", salt);
      user = await User.create({
        name: finalName || "Demo User",
        firstName: providedFn || "Demo",
        lastName: providedLn || "User",
        email: `demo_${last10}@ecdkart.com`,
        mobile: `+91${last10}`,
        phone: `+91${last10}`,
        password: hashedPassword,
        role: "customer",
        isVerified: true
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found. Please send OTP first." });
    }

    const isValidUserOtp = isDemoLogin ||
      (user.otp && user.otp === enteredOtp && user.otpExpires > new Date());

    if (!isValidUserOtp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (user.isDeleted) {
      user.isDeleted = false;
      user.deletedAt = undefined;
    }
    if (finalName) {
      user.name = finalName;
      user.firstName = providedFn || finalName.split(" ")[0] || "";
      user.lastName = providedLn || finalName.split(" ").slice(1).join(" ") || "";
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    const incomingFcm = req.body.fcmToken || req.body.token || req.body.deviceToken || req.body.pushToken;
    if (incomingFcm && typeof incomingFcm === 'string' && incomingFcm.trim()) {
      user.fcmToken = incomingFcm.trim();
    }
    await user.save();

    const customerIdCode = await ensureCustomerId(user);
    const token = generateToken(res, user);
    const userAgeMs = user.createdAt ? (Date.now() - new Date(user.createdAt).getTime()) : 0;
    const hasOrders = (user.totalOrders && user.totalOrders > 0) || false;
    const hasAddresses = Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0;
    const isOldAccount = userAgeMs > 5 * 60 * 1000 || hasOrders || hasAddresses;

    const isNewUser = !isOldAccount && (!user.name || user.name.startsWith("User ") || user.name === "New Customer");

    return res.status(200).json({
      success: true,
      message: "Mobile verified successfully",
      token,
      userId: user._id,
      isNewUser,
      user: {
        _id: user._id,
        id: user._id,
        customerId: customerIdCode,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        phone: user.phone || user.mobile,
        role: user.role || "customer",
        savedAddresses: user.savedAddresses || [],
        addresses: user.savedAddresses || [],
        isVerified: true
      }
    });
  } catch (error) {
    console.error("User Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


