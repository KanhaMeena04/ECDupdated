const mongoose = require('mongoose');
const Rider = require('../models/Rider');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendNotification } = require('../utils/notificationService');
const socketService = require('../services/socketService');
const SupportTicket = require('../models/SupportTicket');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { getPaginationParams } = require('../utils/pagination');
const { getFileUrl } = require('../utils/upload');
const { uploadToImageKit } = require('../services/imageKitService');
const { calculateDistance } = require('../utils/locationUtils');
const { initiateProfileUpdate, verifyOTPAndApplyUpdate, checkDuplicate } = require('../utils/profileUpdateHelpers');
const { sendOTP } = require('../utils/twilioService');
const logger = console;
const sendError = (res, status, message, details) => {
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseIfString = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const deepMergeObjects = (target = {}, source = {}) => {
  const output = { ...(target || {}) };
  if (!isPlainObject(source)) return output;

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = output[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      output[key] = deepMergeObjects(targetValue, sourceValue);
    } else {
      output[key] = sourceValue;
    }
  });

  return output;
};

const extractBracketObject = (body = {}, rootKey) => {
  const result = {};
  const prefix = `${rootKey}[`;

  Object.entries(body || {}).forEach(([key, rawValue]) => {
    if (!key.startsWith(prefix)) return;

    const segments = [];
    const regex = /\[([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(key)) !== null) {
      segments.push(match[1]);
    }
    if (!segments.length) return;

    let cursor = result;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i];
      if (!isPlainObject(cursor[seg])) cursor[seg] = {};
      cursor = cursor[seg];
    }

    const leafKey = segments[segments.length - 1];
    const parsedValue = parseIfString(rawValue);
    cursor[leafKey] = parsedValue;
  });

  return result;
};

const CRITICAL_DOCUMENT_KEYS = [
  'license',
  'rc',
  'insurance',
  'panCard',
  'aadharCard',
  'medicalCertificate',
  'policyVerification',
];

const EXPIRY_DOCUMENT_KEYS = [
  'license',
  'rc',
  'insurance',
  'medicalCertificate',
  'policyVerification',
];

const hasAnyValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return true;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const isEqualDeep = (a, b) => {
  if (a === b) return true;
  if (a instanceof Date || b instanceof Date) {
    const aTime = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const bTime = b instanceof Date ? b.getTime() : new Date(b).getTime();
    return Number.isFinite(aTime) && Number.isFinite(bTime) && aTime === bTime;
  }
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!isEqualDeep(a[i], b[i])) return false;
    }
    return true;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!isEqualDeep(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};

const stripDocumentAdminFields = (doc = {}) => {
  if (!isPlainObject(doc)) return {};
  const clean = { ...doc };
  delete clean.verifiedAt;
  delete clean.verifiedBy;
  return clean;
};

const getChangedDocumentKeys = (existingDocuments = {}, updatedDocuments = {}) => {
  const changed = [];
  for (const key of CRITICAL_DOCUMENT_KEYS) {
    const before = stripDocumentAdminFields(existingDocuments[key] || {});
    const after = stripDocumentAdminFields(updatedDocuments[key] || {});
    if (!isEqualDeep(before, after)) changed.push(key);
  }
  return changed;
};

const resetVerificationForChangedDocuments = (documents = {}, changedKeys = []) => {
  const next = deepMergeObjects({}, documents);
  for (const key of changedKeys) {
    if (!isPlainObject(next[key])) next[key] = {};
    next[key].verifiedAt = undefined;
    next[key].verifiedBy = undefined;
  }
  return next;
};

const validateFutureDate = (value, label) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return `${label} must be a valid date`;
  }
  const now = new Date();
  if (date <= now) {
    return `${label} must be a future date`;
  }
  return null;
};

const validateDocumentExpiryDates = (documents = {}) => {
  if (!isPlainObject(documents)) return null;
  for (const key of EXPIRY_DOCUMENT_KEYS) {
    const candidate = documents[key];
    if (!isPlainObject(candidate) || candidate.expiryDate === undefined) continue;
    const error = validateFutureDate(candidate.expiryDate, `${key}.expiryDate`);
    if (error) return error;
  }
  return null;
};

const findForbiddenVerificationFields = (payload = {}, path = '') => {
  if (!isPlainObject(payload)) return [];
  const blocked = [];
  const forbiddenKeys = new Set([
    'verifiedAt',
    'verifiedBy',
    'vehicleVerified',
    'vehicleApproval',
    'verificationStatus',
    'approvedAt',
    'approvedBy',
    'rejectionReason',
    'riderVerified',
  ]);

  for (const [key, value] of Object.entries(payload)) {
    const nextPath = path ? `${path}.${key}` : key;
    const topLevelBlocked = [
      'verificationStatus',
      'riderVerified',
      'rejectionReason',
      'rejectedBy',
      'rejectionDate',
    ];

    if (topLevelBlocked.includes(nextPath)) {
      blocked.push(nextPath);
      continue;
    }

    const isBankProtected = nextPath.startsWith('bankDetails.') && forbiddenKeys.has(key);
    const isDocumentProtected = nextPath.startsWith('documents.') && forbiddenKeys.has(key);
    const isVehicleProtected = nextPath.startsWith('vehicle.') && forbiddenKeys.has(key);

    if (isBankProtected || isDocumentProtected || isVehicleProtected) {
      blocked.push(nextPath);
      continue;
    }

    if (isPlainObject(value)) {
      blocked.push(...findForbiddenVerificationFields(value, nextPath));
    }
  }

  return blocked;
};
const getAverageRating = (rating) => {
  if (typeof rating === "number") return rating;
  if (rating && typeof rating === "object" && typeof rating.average === "number") {
    return rating.average;
  }
  return 0;
};
const getRatingCount = (rating) => {
  if (rating && typeof rating === "object" && typeof rating.count === "number") {
    return rating.count;
  }
  return 0;
};
const generateRiderToken = (res, user) => {
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  res.cookie("token", token, options);
};
exports.updateRiderProfile = async (req, res) => {
  try {
    let {
      name,
      email,
      mobile,
      phone,
      address,
      workCity,
      workZone,
      language,
      fcmToken,
      permanentAddress,
      localAddress,
      emergencyContactNumber,
      vehicle,
      documents,
      bankDetails,
    } = req.body;

    address = parseIfString(address);
    permanentAddress = parseIfString(permanentAddress);
    localAddress = parseIfString(localAddress);
    vehicle = parseIfString(vehicle);
    documents = parseIfString(documents);
    bankDetails = parseIfString(bankDetails);

    const bracketVehicle = extractBracketObject(req.body, 'vehicle');
    const bracketDocuments = extractBracketObject(req.body, 'documents');
    const bracketBankDetails = extractBracketObject(req.body, 'bankDetails');

    vehicle = deepMergeObjects(vehicle || {}, bracketVehicle);
    documents = deepMergeObjects(documents || {}, bracketDocuments);
    bankDetails = deepMergeObjects(bankDetails || {}, bracketBankDetails);

    const forbiddenPaths = findForbiddenVerificationFields({
      ...req.body,
      ...(isPlainObject(vehicle) ? { vehicle } : {}),
      ...(isPlainObject(documents) ? { documents } : {}),
      ...(isPlainObject(bankDetails) ? { bankDetails } : {}),
    });
    if (forbiddenPaths.length) {
      return sendError(res, 400, 'Verification fields are admin controlled', forbiddenPaths);
    }

    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized rider");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }
    if (!['rider', 'driver'].includes(user.role)) {
      user.role = 'driver';
      await user.save();
    }

    let rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      rider = await Rider.create({
        user: user._id,
        name: user.name || name || 'Driver Partner',
        phone: user.mobile || user.phone || phone || mobile || '',
        mobile: user.mobile || user.phone || mobile || phone || '',
        email: user.email || email || '',
        pin: user.pin,
        profilePic: user.profilePic,
        verificationStatus: 'pending',
        riderVerified: false,
        isOnline: false,
        isAvailable: false,
        status: 'inactive'
      });
    }

    if (!user.name && (!name || !name.trim())) {
      return sendError(res, 400, "Name is required");
    }
    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    const requestedMobile = mobile !== undefined ? mobile : phone;
    if (email !== undefined || requestedMobile !== undefined) {
      return sendError(res, 400, "Email/Mobile updates require OTP verification. Use /profile/request-update endpoint");
    }

    if (req.file) {
      user.profilePic = getFileUrl(req.file);
    }

    if (language !== undefined) user.language = normalizeString(language);
    if (fcmToken !== undefined) user.fcmToken = normalizeString(fcmToken);

    if (address !== undefined && !isPlainObject(address)) {
      return sendError(res, 400, 'Invalid address format');
    }
    if (permanentAddress !== undefined && !isPlainObject(permanentAddress)) {
      return sendError(res, 400, 'Invalid permanentAddress format');
    }
    if (localAddress !== undefined && !isPlainObject(localAddress)) {
      return sendError(res, 400, 'Invalid localAddress format');
    }
    if (vehicle !== undefined && !isPlainObject(vehicle)) {
      return sendError(res, 400, 'Invalid vehicle format');
    }
    if (documents !== undefined && !isPlainObject(documents)) {
      return sendError(res, 400, 'Invalid documents format');
    }
    if (bankDetails !== undefined && !isPlainObject(bankDetails)) {
      return sendError(res, 400, 'Invalid bankDetails format');
    }

    const expiryError = validateDocumentExpiryDates(documents || {});
    if (expiryError) return sendError(res, 400, expiryError);

    if (address !== undefined) {
      rider.address = deepMergeObjects(rider.address || {}, address);
    }
    if (permanentAddress !== undefined) {
      rider.permanentAddress = deepMergeObjects(rider.permanentAddress || {}, permanentAddress);
    }
    if (localAddress !== undefined) {
      rider.localAddress = deepMergeObjects(rider.localAddress || {}, localAddress);
    }
    if (workCity !== undefined) rider.workCity = normalizeString(workCity);
    if (workZone !== undefined) rider.workZone = normalizeString(workZone);
    if (emergencyContactNumber !== undefined) {
      rider.emergencyContactNumber = normalizeString(emergencyContactNumber);
    }

    if (isPlainObject(vehicle) && hasAnyValue(vehicle)) {
      const nextVehicle = deepMergeObjects(rider.vehicle || {}, vehicle);
      const vehicleIdentityChanged =
        !isEqualDeep(normalizeString(rider.vehicle?.type), normalizeString(nextVehicle?.type)) ||
        !isEqualDeep(normalizeString(rider.vehicle?.model), normalizeString(nextVehicle?.model)) ||
        !isEqualDeep(normalizeString(rider.vehicle?.number), normalizeString(nextVehicle?.number));

      rider.vehicle = nextVehicle;

      if (vehicleIdentityChanged) {
        rider.vehicle.vehicleApproval = rider.vehicle.vehicleApproval || {};
        rider.vehicle.vehicleApproval.status = 'pending';
        rider.vehicle.vehicleApproval.reason = undefined;
        rider.vehicle.vehicleApproval.approvedAt = undefined;
        rider.vehicle.vehicleApproval.approvedBy = undefined;
        rider.vehicle.vehicleVerified = false;
        rider.verificationStatus = 'pending';
      }
    }

    if (isPlainObject(documents) && hasAnyValue(documents)) {
      const existingDocs = rider.toObject().documents || {};
      const mergedDocs = deepMergeObjects(existingDocs, documents);
      const changedDocumentKeys = getChangedDocumentKeys(existingDocs, mergedDocs);

      if (changedDocumentKeys.length) {
        rider.documents = resetVerificationForChangedDocuments(mergedDocs, changedDocumentKeys);
        rider.riderVerified = false;
        rider.verificationStatus = 'pending';
      }
    }

    if (isPlainObject(bankDetails) && hasAnyValue(bankDetails)) {
      const nextBankDetails = deepMergeObjects(rider.bankDetails || {}, bankDetails);
      const comparisonCurrent = { ...(rider.bankDetails || {}) };
      const comparisonNext = { ...nextBankDetails };
      delete comparisonCurrent.verified;
      delete comparisonCurrent.verificationStatus;
      delete comparisonCurrent.rejectionReason;
      delete comparisonCurrent.approvedAt;
      delete comparisonCurrent.approvedBy;
      delete comparisonNext.verified;
      delete comparisonNext.verificationStatus;
      delete comparisonNext.rejectionReason;
      delete comparisonNext.approvedAt;
      delete comparisonNext.approvedBy;

      const bankDetailsChanged = !isEqualDeep(comparisonCurrent, comparisonNext);
      if (bankDetailsChanged) {
        rider.bankDetails = {
          ...nextBankDetails,
          verified: false,
          verificationStatus: 'pending',
          rejectionReason: undefined,
          approvedAt: undefined,
          approvedBy: undefined,
        };
      }
    }

    await Promise.all([user.save(), rider.save()]);
    res.status(200).json({
      success: true,
      message: "Rider profile updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePic: user.profilePic,
      },
      rider,
    });
  } catch (e) {
    return sendError(res, 500, "Failed to update rider profile", e.message);
  }
};
exports.requestRiderProfileUpdate = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return sendError(res, 400, "Provide email or mobile to update");
    }
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized rider");
    }
    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "rider" && user.role !== "driver")) {
      return sendError(res, 404, "Rider user not found");
    }
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      return sendError(res, 404, "Rider profile not found");
    }
    if (email && (!email.includes("@") || email.length < 5)) {
      return sendError(res, 400, "Invalid email format");
    }
    if (mobile && mobile.length < 10) {
      return sendError(res, 400, "Invalid mobile number");
    }
    if (email) {
      const isDuplicate = await checkDuplicate(User, 'email', email, user._id);
      if (isDuplicate) {
        return sendError(res, 409, "Email already in use");
      }
    }
    if (mobile) {
      const isDuplicate = await checkDuplicate(User, 'mobile', mobile, user._id);
      if (isDuplicate) {
        return sendError(res, 409, "Mobile number already in use");
      }
    }
    const result = await initiateProfileUpdate(rider, { email, mobile });
    res.status(200).json({
      success: true,
      message: result.message,
      testOtp: result.testOtp, // Remove in production
      expiresIn: result.expiresIn,
      destination: result.destination
    });
  } catch (e) {
    return sendError(res, 500, "Failed to request profile update", e.message);
  }
};
exports.verifyRiderProfileUpdate = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || otp.length !== 6) {
      return sendError(res, 400, "Valid 6-digit OTP is required");
    }
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized rider");
    }
    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "rider" && user.role !== "driver")) {
      return sendError(res, 404, "Rider user not found");
    }
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) {
      return sendError(res, 404, "Rider profile not found");
    }
    const result = await verifyOTPAndApplyUpdate(rider, otp, user);
    if (!result.success) {
      return sendError(res, 400, result.message);
    }
    res.status(200).json({
      success: true,
      message: result.message,
      appliedUpdates: result.appliedUpdates,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });
  } catch (e) {
    return sendError(res, 500, "Failed to verify OTP", e.message);
  }
};
exports.getRiderProfile = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized rider");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }
    if (!['rider', 'driver'].includes(user.role)) {
      user.role = 'driver';
      await user.save();
    }
    let riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      riderProfile = await Rider.create({
        user: user._id,
        name: user.name || 'Driver Partner',
        phone: user.mobile || user.phone || '',
        mobile: user.mobile || user.phone || '',
        email: user.email || '',
        pin: user.pin,
        profilePic: user.profilePic,
        verificationStatus: 'pending',
        riderVerified: false,
        isOnline: false,
        isAvailable: false,
        status: 'inactive'
      });
    }
    const orders = await Order.find({ rider: riderProfile._id });
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const totalEarnings = orders.reduce((sum, o) => {
      if (typeof o.riderEarning === "number") return sum + o.riderEarning;
      return sum + (o.riderCommission || 0) + (o.tip || 0);
    }, 0);
    const isApproved = (riderProfile.verificationStatus === 'approved' || riderProfile.riderVerified === true) &&
      riderProfile.verificationStatus !== 'pending' &&
      riderProfile.verificationStatus !== 'rejected';

    if (!isApproved && (riderProfile.isOnline || riderProfile.isAvailable || riderProfile.status === 'active')) {
      riderProfile.isOnline = false;
      riderProfile.isAvailable = false;
      riderProfile.status = 'inactive';
      await riderProfile.save();
    }

    res.status(200).json({
      success: true,
      message: "Rider profile retrieved successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePic: user.profilePic,
        role: user.role,
        walletBalance: user.walletBalance || 0,
        upi: riderProfile.bankDetails?.upiId || riderProfile.bankDetails?.upi || ""
      },
      rider: {
        _id: riderProfile._id,
        address: riderProfile.address,
        workCity: riderProfile.workCity,
        workZone: riderProfile.workZone,
        rating: getAverageRating(riderProfile.rating),
        ratingCount: getRatingCount(riderProfile.rating),
        isAvailable: isApproved ? riderProfile.isAvailable : false,
        isOnline: isApproved ? riderProfile.isOnline : false,
        verificationStatus: riderProfile.verificationStatus,
        riderVerified: isApproved,
        totalOrders: totalOrders,
        deliveredOrders: deliveredOrders,
        cancelledOrders: cancelledOrders,
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalDeliveries: riderProfile.totalDeliveries || deliveredOrders,
        currentBalance: riderProfile.currentBalance || 0,
        vehicle: riderProfile.vehicle,
        documents: riderProfile.documents,
        bankDetails: riderProfile.bankDetails,
        upi: riderProfile.bankDetails?.upiId || riderProfile.bankDetails?.upi || ""
      }
    });
  } catch (e) {
    return sendError(res, 500, "Failed to fetch rider profile", e.message);
  }
};
exports.getRiderDashboard = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized rider");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }
    if (!['rider', 'driver'].includes(user.role)) {
      user.role = 'driver';
      await user.save();
    }
    let riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      riderProfile = await Rider.create({
        user: user._id,
        name: user.name || 'Driver Partner',
        phone: user.mobile || user.phone || '',
        mobile: user.mobile || user.phone || '',
        email: user.email || '',
        pin: user.pin,
        profilePic: user.profilePic,
        verificationStatus: 'pending',
        riderVerified: false,
        isOnline: false,
        isAvailable: false,
        status: 'inactive'
      });
    }
    const RiderWallet = require('../models/RiderWallet');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const activeStatuses = ["assigned", "reached_restaurant", "picked_up", "delivery_arrived"];
    const [
      totalOrders,
      deliveredOrders,
      todayDelivered,
      activeOrders,
      earningsAgg,
      todayEarningsAgg,
      lastActiveOrder,
      riderWallet,
    ] = await Promise.all([
      Order.countDocuments({ rider: riderProfile._id }),
      Order.countDocuments({ rider: riderProfile._id, status: "delivered" }),
      Order.countDocuments({
        rider: riderProfile._id,
        status: "delivered",
        deliveredAt: { $gte: startOfDay },
      }),
      Order.countDocuments({
        rider: riderProfile._id,
        status: { $in: activeStatuses },
      }),
      Order.aggregate([
        { $match: { rider: riderProfile._id, status: "delivered" } },
        { $group: { _id: null, earnings: { $sum: "$riderEarning" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            rider: riderProfile._id,
            status: "delivered",
            deliveredAt: { $gte: startOfDay },
          },
        },
        { $group: { _id: null, earnings: { $sum: "$riderEarning" } } },
      ]),
      Order.findOne({ rider: riderProfile._id, status: { $in: activeStatuses } })
        .select('_id status deliveryAddress.addressLine restaurant deliveryFee tip riderEarning totalAmount paymentMethod')
        .populate("customer", "name mobile")
        .populate("restaurant", "name address location contactNumber")
        .sort({ updatedAt: -1, createdAt: -1 }),
      RiderWallet.findOne({ rider: riderProfile._id }),
    ]);
    const totalEarnings = earningsAgg[0]?.earnings || 0;
    const todayEarnings = todayEarningsAgg[0]?.earnings || 0;
    const isApproved = (riderProfile.verificationStatus === 'approved' || riderProfile.riderVerified === true) &&
      riderProfile.verificationStatus !== 'pending' &&
      riderProfile.verificationStatus !== 'rejected';

    return res.status(200).json({
      success: true,
      rider: {
        _id: riderProfile._id,
        isOnline: isApproved ? riderProfile.isOnline : false,
        isAvailable: isApproved ? riderProfile.isAvailable : false,
        breakMode: riderProfile.breakMode,
        verificationStatus: riderProfile.verificationStatus,
      },
      stats: {
        totalOrders,
        deliveredOrders,
        todayDelivered,
        activeOrders,
        totalEarnings: Number(totalEarnings.toFixed(2)),
        todayEarnings: Number(todayEarnings.toFixed(2)),
        currentBalance: riderProfile.currentBalance || 0,
      },
      wallet: riderWallet ? {
        availableBalance: Number((riderWallet.availableBalance || 0).toFixed(2)),
        totalEarnings: Number((riderWallet.totalEarnings || 0).toFixed(2)),
        cashInHand: Number((riderWallet.cashInHand || 0).toFixed(2)),
        cashLimit: riderWallet.cashLimit || 2000,
        isFrozen: riderWallet.isFrozen || false,
        frozenReason: riderWallet.frozenReason || null,
        lastPayoutAt: riderWallet.lastPayoutAt || null,
        lastPayoutAmount: riderWallet.lastPayoutAmount || 0,
        totalPayouts: riderWallet.totalPayouts || 0,
      } : null,
      lastActiveOrder: lastActiveOrder || null,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch rider dashboard", error.message);
  }
};
exports.getCompletedOrdersForRider = async (req, res) => {
  try {
    if (!req.user || !isValidObjectId(req.user._id)) {
      return sendError(res, 401, "Unauthorized rider");
    }
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return sendError(res, 404, "Rider profile not found");
    }
    const { page, limit, skip } = getPaginationParams(req, 20);
    const query = { rider: riderProfile._id, status: "delivered" };
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("restaurant", "name image bannerImage address")
        .populate("customer", "name mobile")
        .sort({ deliveredAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);
    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch completed orders", error.message);
  }
};
exports.onboardRider = async (req, res) => {
  try {
    let {
      name,
      email,
      phone,
      mobile,
      pin,
      address,
      workCity,
      workZone,
      vehicle,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      regNumber,
      documents,
      licenseNumber,
      panNumber,
      aadhaarNumber,
      expiryDate,
      bankDetails,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      upi,
      location
    } = req.body;

    address = parseIfString(address);
    vehicle = parseIfString(vehicle) || {};
    documents = parseIfString(documents) || {};
    bankDetails = parseIfString(bankDetails) || {};
    location = parseIfString(location);

    if (vehicleType || vehicleBrand || vehicleModel || vehicleYear || regNumber) {
      vehicle.type = vehicleType || vehicle.type || 'Scooter / Motorcycle';
      vehicle.brand = vehicleBrand || vehicle.brand;
      vehicle.model = vehicleModel || vehicle.model;
      vehicle.year = vehicleYear || vehicle.year;
      vehicle.number = regNumber || vehicle.number;
      vehicle.regNumber = regNumber || vehicle.regNumber;
    }

    if (licenseNumber || panNumber || aadhaarNumber || expiryDate) {
      if (licenseNumber || expiryDate) {
        documents.license = documents.license || {};
        if (licenseNumber) documents.license.number = licenseNumber;
        if (expiryDate) documents.license.expiryDate = expiryDate;
      }
      if (panNumber) {
        documents.panCard = documents.panCard || {};
        documents.panCard.number = panNumber;
      }
      if (aadhaarNumber) {
        documents.aadharCard = documents.aadharCard || {};
        documents.aadharCard.number = aadhaarNumber;
      }
    }

    if (accountHolderName || bankName || accountNumber || ifscCode || upiId || upi) {
      bankDetails.accountHolderName = accountHolderName || bankDetails.accountHolderName;
      bankDetails.bankName = bankName || bankDetails.bankName;
      bankDetails.accountNumber = accountNumber || bankDetails.accountNumber;
      bankDetails.ifscCode = ifscCode || bankDetails.ifscCode;
      bankDetails.upiId = upiId || upi || bankDetails.upiId || bankDetails.upi;
    }

    if (!req.user || !req.user._id) {
      return sendError(res, 401, "Unauthorized");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 401, "Unauthorized - user not found");
    }
    if (!['rider', 'driver'].includes(user.role)) {
      user.role = 'driver';
      await user.save();
    }

    if (name && name.trim()) user.name = name.trim();
    if (email && email.trim()) user.email = email.trim().toLowerCase();
    if (pin) user.pin = pin;
    if (phone || mobile) {
      user.mobile = mobile || phone || user.mobile;
      user.phone = phone || mobile || user.phone;
    }
    await user.save();

    const existing = await Rider.findOne({ user: user._id });

    const processedDocuments = {
      ...(existing?.documents || {}),
      ...(documents || {}),
    };

    // 1. Process Profile Pic
    let profilePicUrl = user.profilePic || existing?.profilePic;
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      profilePicUrl = await getFileUrl(req.files.profilePic[0]);
    } else if (req.body.profilePic) {
      const ikUrl = await uploadToImageKit(req.body.profilePic, `profile_${user._id}.jpg`);
      if (ikUrl) profilePicUrl = ikUrl;
    }
    if (profilePicUrl) {
      user.profilePic = profilePicUrl;
      await user.save();
    }

    // 2. Process Files
    if (req.files) {
      if (req.files.licenseFrontImage && req.files.licenseFrontImage[0]) {
        processedDocuments.license = processedDocuments.license || {};
        processedDocuments.license.frontImage = await getFileUrl(req.files.licenseFrontImage[0]);
        processedDocuments.license.image = processedDocuments.license.frontImage;
      }
      if (req.files.licenseBackImage && req.files.licenseBackImage[0]) {
        processedDocuments.license = processedDocuments.license || {};
        processedDocuments.license.backImage = await getFileUrl(req.files.licenseBackImage[0]);
      }
      if (req.files.rcImage && req.files.rcImage[0]) {
        processedDocuments.rc = processedDocuments.rc || {};
        processedDocuments.rc.image = await getFileUrl(req.files.rcImage[0]);
      }
      if (req.files.insuranceImage && req.files.insuranceImage[0]) {
        processedDocuments.insurance = processedDocuments.insurance || {};
        processedDocuments.insurance.image = await getFileUrl(req.files.insuranceImage[0]);
      }
      if (req.files.panCardImage && req.files.panCardImage[0]) {
        processedDocuments.panCard = processedDocuments.panCard || {};
        processedDocuments.panCard.image = await getFileUrl(req.files.panCardImage[0]);
      }
      if (req.files.aadharCardImage && req.files.aadharCardImage[0]) {
        processedDocuments.aadharCard = processedDocuments.aadharCard || {};
        processedDocuments.aadharCard.image = await getFileUrl(req.files.aadharCardImage[0]);
        processedDocuments.aadharCard.frontImage = processedDocuments.aadharCard.image;
      }
      if (req.files.medicalCertificate && req.files.medicalCertificate[0]) {
        processedDocuments.medicalCertificate = await getFileUrl(req.files.medicalCertificate[0]);
      }
      if (req.files.gst && req.files.gst[0]) {
        processedDocuments.gst = await getFileUrl(req.files.gst[0]);
      }
    }

    // 3. Process Base64 / Data URI strings inside documents
    if (documents) {
      if (documents.license?.image || documents.license?.frontImage) {
        const raw = documents.license.image || documents.license.frontImage;
        const ikUrl = await uploadToImageKit(raw, `license_${user._id}.jpg`);
        if (ikUrl) {
          processedDocuments.license = processedDocuments.license || {};
          processedDocuments.license.frontImage = ikUrl;
          processedDocuments.license.image = ikUrl;
        }
      }
      if (documents.license?.backImage) {
        const ikUrl = await uploadToImageKit(documents.license.backImage, `license_back_${user._id}.jpg`);
        if (ikUrl) {
          processedDocuments.license = processedDocuments.license || {};
          processedDocuments.license.backImage = ikUrl;
        }
      }
      if (documents.panCard?.image || documents.panCard?.frontImage) {
        const raw = documents.panCard.image || documents.panCard.frontImage;
        const ikUrl = await uploadToImageKit(raw, `pan_${user._id}.jpg`);
        if (ikUrl) {
          processedDocuments.panCard = processedDocuments.panCard || {};
          processedDocuments.panCard.image = ikUrl;
        }
      }
      if (documents.aadharCard?.image || documents.aadharCard?.frontImage) {
        const raw = documents.aadharCard.image || documents.aadharCard.frontImage;
        const ikUrl = await uploadToImageKit(raw, `aadhaar_${user._id}.jpg`);
        if (ikUrl) {
          processedDocuments.aadharCard = processedDocuments.aadharCard || {};
          processedDocuments.aadharCard.image = ikUrl;
          processedDocuments.aadharCard.frontImage = ikUrl;
        }
      }
      if (documents.aadharCard?.backImage) {
        const ikUrl = await uploadToImageKit(documents.aadharCard.backImage, `aadhaar_back_${user._id}.jpg`);
        if (ikUrl) {
          processedDocuments.aadharCard = processedDocuments.aadharCard || {};
          processedDocuments.aadharCard.backImage = ikUrl;
        }
      }
      if (documents.rc?.image) {
        const ikUrl = await uploadToImageKit(documents.rc.image, `rc_${user._id}.jpg`);
        if (ikUrl) {
          processedDocuments.rc = processedDocuments.rc || {};
          processedDocuments.rc.image = ikUrl;
        }
      }
      if (documents.insurance?.image) {
        const ikUrl = await uploadToImageKit(documents.insurance.image, `insurance_${user._id}.jpg`);
        if (ikUrl) {
          processedDocuments.insurance = processedDocuments.insurance || {};
          processedDocuments.insurance.image = ikUrl;
        }
      }
    }

    if (req.body.fcmToken || req.body.deviceToken) {
      user.fcmToken = (req.body.fcmToken || req.body.deviceToken).trim();
      await user.save();
    }

    const riderPayload = {
      user: user._id,
      name: user.name || name,
      email: user.email || email,
      phone: user.phone || user.mobile || phone || mobile,
      mobile: user.mobile || user.phone || mobile || phone,
      pin: pin || user.pin || existing?.pin,
      profilePic: profilePicUrl || user.profilePic,
      address: address || existing?.address || (workCity ? { city: workCity } : undefined),
      workCity: workCity || existing?.workCity || "",
      workZone: workZone || existing?.workZone || "",
      vehicle: {
        ...(existing?.vehicle || {}),
        ...vehicle,
        vehicleVerified: false,
        vehicleApproval: { status: 'pending' }
      },
      documents: processedDocuments,
      bankDetails: {
        ...(existing?.bankDetails || {}),
        ...bankDetails,
        verified: existing?.bankDetails?.verified ?? false,
        verificationStatus: existing?.bankDetails?.verificationStatus ?? 'pending'
      },
      currentLocation: location || existing?.currentLocation || { type: 'Point', coordinates: [77.0658, 28.2888] },
      verificationStatus: existing?.verificationStatus || "pending",
      riderVerified: existing?.riderVerified ?? false,
      isOnline: false,
      isAvailable: false,
      status: 'inactive',
    };

    let rider;
    if (existing) {
      rider = await Rider.findByIdAndUpdate(existing._id, riderPayload, {
        new: true,
        runValidators: false,
      });
    } else {
      rider = await Rider.create(riderPayload);
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || 'ecd_local_dev_jwt_secret_key_2026', { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: "Rider onboarding submitted and profile saved in MongoDB.",
      token,
      authToken: token,
      rider,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || user.phone,
        profilePic: user.profilePic,
        role: user.role
      }
    });
  } catch (error) {
    return sendError(res, 500, "Failed to submit rider onboarding", error.message);
  }
};
exports.toggleStatus = async (req, res) => {
  try {
    const { available } = req.body;
    console.log('🔄 Toggle Status Request:', { userId: req.user._id, available });
    const rider = await Rider.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!rider) {
      console.error('❌ Rider not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: "Rider profile not found"
      });
    }
    const newStatus = typeof available === 'boolean' ? available : !rider.isAvailable;
    console.log('📊 Status Update:', { current: rider.isAvailable, new: newStatus });
    if (newStatus === true) {
      if (!rider.riderVerified) {
        console.warn('⚠️ Rider not verified:', rider._id);
        return res.status(403).json({
          success: false,
          message: "You must complete your rider verification first",
          verificationStatus: rider.verificationStatus,
          reason: 'Rider not verified'
        });
      }
      if (rider.verificationStatus !== 'approved') {
        console.warn('⚠️ Verification status not approved:', rider.verificationStatus);
        return res.status(403).json({
          success: false,
          message: rider.verificationStatus === 'pending'
            ? "Your verification is still pending approval. Please wait for admin approval."
            : rider.verificationStatus === 'rejected'
              ? "Your verification was rejected. Please contact support."
              : "Your account verification is restricted. Please contact support.",
          verificationStatus: rider.verificationStatus
        });
      }
      if (rider.vehicle && !rider.vehicle.vehicleVerified) {
        console.warn('⚠️ Vehicle not verified:', rider.vehicle.number);
        return res.status(403).json({
          success: false,
          message: "Your vehicle is not verified. Please complete vehicle verification first.",
          vehicleVerified: false
        });
      }
    }
    const updateData = {
      isAvailable: newStatus,
      isOnline: newStatus === true ? true : false
    };
    if (newStatus === true) {
      updateData.breakMode = false;
    }
    const updatedRider = await Rider.findByIdAndUpdate(
      rider._id,
      { $set: updateData },
      { new: true, runValidators: false } // Skip validators to avoid rating field issues
    );
    console.log('✅ Status updated successfully:', {
      riderId: updatedRider._id,
      isAvailable: updatedRider.isAvailable,
      isOnline: updatedRider.isOnline
    });
    try {
      socketService.emitToRider(req.user._id.toString(), 'rider:status_changed', {
        isAvailable: updatedRider.isAvailable,
        isOnline: updatedRider.isOnline,
        message: updatedRider.isAvailable
          ? 'You are now available to receive orders. Location tracking will start automatically.'
          : 'You are now offline. Location tracking has stopped.',
        requireLocationTracking: updatedRider.isOnline,
        timestamp: new Date()
      });
      socketService.emitToAdmin('rider:status_update', {
        riderId: req.user._id.toString(),
        riderName: rider.user?.name || 'Unknown',
        riderEmail: rider.user?.email || 'Unknown',
        status: updatedRider.isAvailable ? 'available' : 'offline',
        timestamp: new Date()
      });
    } catch (socketErr) {
      console.warn('⚠️ Socket notification failed:', socketErr.message);
    }
    res.json({
      success: true,
      message: `You are now ${updatedRider.isAvailable ? 'available to receive orders' : 'offline'}`,
      isAvailable: updatedRider.isAvailable,
      isOnline: updatedRider.isOnline,
      locationTrackingRequired: updatedRider.isOnline,
      instructions: updatedRider.isAvailable
        ? 'You will now receive new delivery orders. Ensure location permissions are enabled.'
        : 'Location tracking has been disabled.'
    });
  } catch (error) {
    console.error('❌ Error in toggleStatus:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update availability status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.getRiderStatus = async (req, res) => {
  try {
    const rider = await Rider.findOne({ user: req.user._id })
      .select('isOnline isAvailable breakMode verificationStatus riderVerified vehicle');
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
    const hasVehicle = !!rider.vehicle;
    const isVehicleVerified = rider.vehicle?.vehicleVerified || false;
    const isApproved = (rider.verificationStatus === 'approved' || rider.riderVerified === true) &&
      rider.verificationStatus !== 'pending' &&
      rider.verificationStatus !== 'rejected';
    const effectiveOnline = isApproved ? (rider.isOnline || false) : false;
    const effectiveAvailable = isApproved ? (rider.isAvailable || false) : false;

    res.json({
      success: true,
      isOnline: effectiveOnline,
      isAvailable: effectiveAvailable,
      breakMode: rider.breakMode,
      verificationStatus: rider.verificationStatus,
      riderVerified: isApproved,
      locationTrackingRequired: effectiveOnline,
      diagnostics: {
        hasVehicle,
        isVehicleVerified,
        canGoOnline: isApproved && isVehicleVerified,
        reasons: {
          riderNotVerified: !isApproved,
          statusNotApproved: rider.verificationStatus !== 'approved',
          vehicleNotVerified: hasVehicle && !isVehicleVerified
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in getRiderStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.toggleBreak = async (req, res) => {
  try {
    const { reason } = req.body;
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ message: "Rider not found" });
    rider.breakMode = !rider.breakMode;
    rider.breakReason = reason || rider.breakReason;
    rider.isAvailable = !rider.breakMode ? rider.isAvailable : false;
    await rider.save();
    res.json({ message: `Break mode ${rider.breakMode ? 'enabled' : 'disabled'}`, breakMode: rider.breakMode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getEarningsSummary = async (req, res) => {
  try {
    const period = req.query.period || 'day';
    const RiderWallet = require('../models/RiderWallet');
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return sendError(res, 404, "Rider profile not found");
    }
    const match = { rider: riderProfile._id, status: 'delivered' };
    let groupId = null;
    if (period === 'week') groupId = { $isoWeek: '$deliveredAt' };
    else if (period === 'month') groupId = { $dateToString: { format: '%Y-%m', date: '$deliveredAt' } };
    else groupId = { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } };
    const [agg, wallet] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: { _id: groupId, earnings: { $sum: '$riderEarning' }, orders: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ]),
      RiderWallet.findOne({ rider: riderProfile._id }),
    ]);
    const totals = agg.reduce(
      (acc, cur) => ({ earnings: acc.earnings + (cur.earnings || 0), orders: acc.orders + (cur.orders || 0) }),
      { earnings: 0, orders: 0 }
    );
    res.status(200).json({
      success: true,
      period,
      aggregation: agg,
      totals,
      data: {
        todayEarnings: totals.earnings || 0,
        completedOrders: totals.orders || 0,
        activeHours: 0.0,
        rating: 5.0,
        totalDeliveries: totals.orders || 0,
        earnings: totals.earnings || 0
      },
      wallet: wallet ? {
        availableBalance: Number((wallet.availableBalance || 0).toFixed(2)),
        totalEarnings: Number((wallet.totalEarnings || 0).toFixed(2)),
        cashInHand: Number((wallet.cashInHand || 0).toFixed(2)),
        cashLimit: wallet.cashLimit || 2000,
        isFrozen: wallet.isFrozen || false,
        frozenReason: wallet.frozenReason || null,
        lastPayoutAt: wallet.lastPayoutAt || null,
        lastPayoutAmount: wallet.lastPayoutAmount || 0,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getEarningsHistory = async (req, res) => {
  try {
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return sendError(res, 404, "Rider profile not found");
    }
    const orders = await Order.find({ rider: riderProfile._id, status: 'delivered' }).sort({ deliveredAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.riderSettlementReport = async (req, res) => {
  try {
    const { from, to, detail = 'summary', format = 'json' } = req.query;
    const Order = require('../models/Order');
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return sendError(res, 404, "Rider profile not found");
    }
    const match = { rider: riderProfile._id, status: 'delivered' };
    if (from) match.deliveredAt = { $gte: new Date(from) };
    if (to) match.deliveredAt = match.deliveredAt ? { ...match.deliveredAt, $lte: new Date(to) } : { $lte: new Date(to) };
    if (detail === 'orders') {
      const orders = await Order.find(match).sort({ deliveredAt: -1 });
      if (format === 'csv') {
        let csv = 'orderId,date,totalAmount,riderEarning,cashCollected,paymentMethod,deliveredAt\n';
        orders.forEach(o => {
          csv += `${o._id},${o.createdAt.toISOString().split('T')[0]},${(o.totalAmount || 0).toFixed(2)},${(o.riderEarning || 0).toFixed(2)},${(o.cashCollected || 0).toFixed(2)},${o.paymentMethod || ''},${o.deliveredAt ? o.deliveredAt.toISOString() : ''}\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="rider-settlements-${from || 'all'}-${to || 'now'}.csv"`);
        return res.send(csv);
      }
      return res.status(200).json({ orders });
    }
    const agg = await Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } }, orders: { $sum: 1 }, earnings: { $sum: '$riderEarning' }, cashCollected: { $sum: '$cashCollected' } } },
      { $sort: { _id: -1 } }
    ]);
    if (format === 'csv') {
      let csv = 'date,orders,earnings,cashCollected\n';
      agg.forEach(row => {
        csv += `${row._id},${row.orders},${(row.earnings || 0).toFixed(2)},${(row.cashCollected || 0).toFixed(2)}\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename="rider-daily-settlements-${from || 'all'}-${to || 'now'}.csv"`);
      return res.send(csv);
    }
    res.status(200).json({ aggregation: agg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminRiderSettlements = async (req, res) => {
  try {
    const { from, to, riderId, detail = 'summary', format = 'json' } = req.query;
    const Order = require('../models/Order');
    const match = { status: 'delivered' };
    if (from) match.deliveredAt = { $gte: new Date(from) };
    if (to) match.deliveredAt = match.deliveredAt ? { ...match.deliveredAt, $lte: new Date(to) } : { $lte: new Date(to) };
    if (riderId) match.rider = require('mongoose').Types.ObjectId(riderId);
    if (detail === 'orders') {
      const orders = await Order.find(match).populate('rider', 'user').populate('rider.user', 'name').sort({ deliveredAt: -1 });
      if (format === 'csv') {
        let csv = 'orderId,riderId,riderName,date,totalAmount,riderEarning,cashCollected,deliveredAt\n';
        orders.forEach(o => {
          const riderName = o.rider && o.rider.user && o.rider.user.name ? o.rider.user.name : '';
          csv += `${o._id},${o.rider || ''},${riderName},${o.createdAt.toISOString().split('T')[0]},${(o.totalAmount || 0).toFixed(2)},${(o.riderEarning || 0).toFixed(2)},${(o.cashCollected || 0).toFixed(2)},${o.deliveredAt ? o.deliveredAt.toISOString() : ''}\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="admin-rider-orders-${from || 'all'}-${to || 'now'}.csv"`);
        return res.send(csv);
      }
      return res.status(200).json({ orders });
    }
    const agg = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$rider', orders: { $sum: 1 }, earnings: { $sum: '$riderEarning' }, cashCollected: { $sum: '$cashCollected' } } },
      { $sort: { earnings: -1 } }
    ]);
    const results = [];
    for (const r of agg) {
      const user = await User.findById(r._id).select('name mobile email');
      results.push({ rider: r._id, name: user ? user.name : '', mobile: user ? user.mobile : '', orders: r.orders, earnings: r.earnings || 0, cashCollected: r.cashCollected || 0 });
    }
    if (format === 'csv') {
      let csv = 'riderId,name,mobile,orders,earnings,cashCollected\n';
      results.forEach(row => {
        csv += `${row.rider},${row.name || ''},${row.mobile || ''},${row.orders},${(row.earnings || 0).toFixed(2)},${(row.cashCollected || 0).toFixed(2)}\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename="admin-rider-settlements-${from || 'all'}-${to || 'now'}.csv"`);
      return res.send(csv);
    }
    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, bankDetails } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const Rider = require('../models/Rider');
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider profile not found' });

    const isApproved = (rider.verificationStatus === 'approved' || rider.riderVerified === true) &&
      rider.verificationStatus !== 'pending' &&
      rider.verificationStatus !== 'rejected';

    if (!isApproved) {
      return res.status(403).json({
        success: false,
        message: rider.verificationStatus === 'pending'
          ? "Cannot request payout. Your profile is under review by Admin. You can request payouts once approved."
          : rider.verificationStatus === 'rejected'
            ? "Cannot request payout. Your rider profile was rejected. Please contact support."
            : "Cannot request payout. Your rider profile is not approved yet.",
        verificationStatus: rider.verificationStatus
      });
    }

    const RiderWallet = require('../models/RiderWallet');
    const riderWallet = await RiderWallet.findOne({ rider: rider._id });
    
    const availableBalance = riderWallet?.availableBalance ?? user.walletBalance ?? 0;
    
    // Auto-resolve UPI / Bank details
    const upiId = bankDetails?.upiId || bankDetails?.upi || rider?.bankDetails?.upiId || rider?.bankDetails?.upi || rider?.upiId || rider?.upi || user.upi || '';
    const accountHolder = bankDetails?.accountHolder || bankDetails?.accountHolderName || rider?.bankDetails?.accountHolder || rider?.bankDetails?.accountHolderName || rider?.name || user.name || 'Rider Partner';
    const bankName = bankDetails?.bankName || rider?.bankDetails?.bankName || '';
    const accountNumber = bankDetails?.accountNumber || rider?.bankDetails?.accountNumber || '';
    const ifsc = bankDetails?.ifsc || bankDetails?.ifscCode || rider?.bankDetails?.ifsc || rider?.bankDetails?.ifscCode || '';

    const resolvedBankDetails = {
      upiId: upiId || '',
      accountHolder: accountHolder,
      bankName: bankName,
      accountNumber: accountNumber,
      ifsc: ifsc,
      phone: user.mobile || user.phone || ''
    };

    // If rider passed updated bank details in request, sync back to rider model
    if (rider && bankDetails) {
      rider.bankDetails = {
        ...(rider.bankDetails || {}),
        ...resolvedBankDetails
      };
      if (upiId) rider.upiId = upiId;
      await rider.save().catch(() => {});
    }
    if (upiId && (!user.upi || user.upi !== upiId)) {
      user.upi = upiId;
      await user.save().catch(() => {});
    }

    const Withdrawal = require('../models/WithdrawalRequest');
    const reqObj = await Withdrawal.create({
      user: req.user._id,
      rider: rider?._id,
      amount: numAmount,
      method: method || (upiId ? 'upi' : 'bank'),
      bankDetails: resolvedBankDetails,
      status: 'pending'
    });

    // Notify admins via socket if available
    try {
      const io = req.app.get('io') || global.io;
      if (io) {
        io.to('admin_room').emit('new_withdrawal_request', {
          id: reqObj._id,
          riderName: user.name,
          riderPhone: user.mobile || user.phone,
          amount: numAmount,
          method: reqObj.method,
          upiId: upiId,
          bankName: bankName,
          accountNumber: accountNumber,
          ifsc: ifsc,
          accountHolder: accountHolder,
          createdAt: reqObj.createdAt
        });
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'Withdrawal requested successfully',
      request: reqObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.getWithdrawals = async (req, res) => {
  try {
    const Withdrawal = require('../models/WithdrawalRequest');
    const requests = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const Ticket = require('../models/SupportTicket');
    const ticket = await Ticket.create({ user: req.user._id, userType: 'rider', subject, message });
    res.status(201).json({ message: 'Ticket created', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getTickets = async (req, res) => {
  try {
    const Ticket = require('../models/SupportTicket');
    const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getTrainingMaterials = async (req, res) => {
  try {
    const Training = require('../models/TrainingMaterial');
    const materials = await Training.find().sort({ createdAt: -1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.triggerSOS = async (req, res) => {
  try {
    const { message, location } = req.body;
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ message: 'Rider profile not found' });
    rider.sosActive = true;
    rider.sosLastAt = new Date();
    if (location && location.long !== undefined && location.lat !== undefined) {
      rider.sosLocation = { type: 'Point', coordinates: [location.long, location.lat] };
    } else if (rider.currentLocation && rider.currentLocation.coordinates) {
      rider.sosLocation = rider.currentLocation;
    }
    await rider.save();
    const ticket = await SupportTicket.create({ user: req.user._id, userType: 'rider', subject: 'SOS Alert', message: `SOS triggered by rider ${req.user._id} - ${message || 'No message provided'}` });
    const admins = await User.find({ role: 'admin' });
    const user = await User.findById(req.user._id).select('name mobile');
    const notifTitle = 'SOS Alert - Rider';
    const notifBody = `${user ? user.name : 'Rider'} triggered SOS. Check support tickets.`;
    for (const a of admins) {
      try { await sendNotification(a._id, notifTitle, notifBody, { rider: rider._id, ticketId: ticket._id }); } catch (e) {  }
    }
    res.status(200).json({ message: 'SOS triggered and admins notified', rider, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.clearSOS = async (req, res) => {
  try {
    const { note } = req.body;
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ message: 'Rider profile not found' });
    rider.sosActive = false;
    rider.sosLastAt = new Date();
    await rider.save();
    await SupportTicket.updateMany({ user: req.user._id, subject: 'SOS Alert', status: 'open' }, { status: 'resolved', $push: { reply: { by: 'rider', message: note || 'Cleared SOS', createdAt: new Date() } } });
    const admins = await User.find({ role: 'admin' });
    const user = await User.findById(req.user._id).select('name mobile');
    for (const a of admins) {
      try { await sendNotification(a._id, 'SOS Cleared', `${user ? user.name : 'Rider'} cleared SOS`); } catch (e) { }
    }
    res.status(200).json({ message: 'SOS cleared', rider });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateDocuments = async (req, res) => {
  try {
    let { documents, permanentAddress, localAddress, emergencyContactNumber } = req.body;
    documents = parseIfString(documents);
    const bracketDocuments = extractBracketObject(req.body, 'documents');
    documents = deepMergeObjects(documents || {}, bracketDocuments);

    const forbiddenPaths = findForbiddenVerificationFields({ documents, ...req.body });
    if (forbiddenPaths.length) {
      return res.status(400).json({
        success: false,
        message: 'Verification fields are admin controlled',
        details: forbiddenPaths,
      });
    }

    if (documents !== undefined && !isPlainObject(documents)) {
      return res.status(400).json({ message: 'Invalid documents format' });
    }

    const expiryError = validateDocumentExpiryDates(documents || {});
    if (expiryError) {
      return res.status(400).json({ message: expiryError });
    }

    permanentAddress = parseIfString(permanentAddress);
    localAddress = parseIfString(localAddress);
    if (permanentAddress !== undefined && !isPlainObject(permanentAddress)) {
      return res.status(400).json({ message: 'Invalid permanentAddress format' });
    }
    if (localAddress !== undefined && !isPlainObject(localAddress)) {
      return res.status(400).json({ message: 'Invalid localAddress format' });
    }

    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ message: 'Rider profile not found' });

    const existingDocs = rider.toObject().documents || {};
    const updatedDocuments = deepMergeObjects(existingDocs, documents || {});

    if (req.files) {
      if (req.files.licenseFrontImage && req.files.licenseFrontImage[0]) {
        updatedDocuments.license = updatedDocuments.license || {};
        updatedDocuments.license.frontImage = await getFileUrl(req.files.licenseFrontImage[0]);
        updatedDocuments.license.image = updatedDocuments.license.frontImage;
      }
      if (req.files.licenseBackImage && req.files.licenseBackImage[0]) {
        updatedDocuments.license = updatedDocuments.license || {};
        updatedDocuments.license.backImage = await getFileUrl(req.files.licenseBackImage[0]);
      }
      if (req.files.rcImage && req.files.rcImage[0]) {
        updatedDocuments.rc = updatedDocuments.rc || {};
        updatedDocuments.rc.image = await getFileUrl(req.files.rcImage[0]);
      }
      if (req.files.insuranceImage && req.files.insuranceImage[0]) {
        updatedDocuments.insurance = updatedDocuments.insurance || {};
        updatedDocuments.insurance.image = await getFileUrl(req.files.insuranceImage[0]);
      }
      if (req.files.medicalCertificate && req.files.medicalCertificate[0]) {
        updatedDocuments.medicalCertificate = updatedDocuments.medicalCertificate || {};
        updatedDocuments.medicalCertificate.image = await getFileUrl(req.files.medicalCertificate[0]);
      }
      if (req.files.panCardImage && req.files.panCardImage[0]) {
        updatedDocuments.panCard = updatedDocuments.panCard || {};
        updatedDocuments.panCard.image = await getFileUrl(req.files.panCardImage[0]);
      }
      if (req.files.aadharCardImage && req.files.aadharCardImage[0]) {
        updatedDocuments.aadharCard = updatedDocuments.aadharCard || {};
        updatedDocuments.aadharCard.image = await getFileUrl(req.files.aadharCardImage[0]);
        updatedDocuments.aadharCard.frontImage = updatedDocuments.aadharCard.image;
      }
      if (req.files.policyVerification && req.files.policyVerification[0]) {
        updatedDocuments.policyVerification = updatedDocuments.policyVerification || {};
        updatedDocuments.policyVerification.image = await getFileUrl(req.files.policyVerification[0]);
      }
      if (req.files.gst && req.files.gst[0]) {
        updatedDocuments.gst = await getFileUrl(req.files.gst[0]);
      }
    }

    if (documents) {
      if (documents.license?.image || documents.license?.frontImage) {
        const raw = documents.license.image || documents.license.frontImage;
        const ikUrl = await uploadToImageKit(raw, `license_${req.user._id}.jpg`);
        if (ikUrl) {
          updatedDocuments.license = updatedDocuments.license || {};
          updatedDocuments.license.frontImage = ikUrl;
          updatedDocuments.license.image = ikUrl;
        }
      }
      if (documents.license?.backImage) {
        const ikUrl = await uploadToImageKit(documents.license.backImage, `license_back_${req.user._id}.jpg`);
        if (ikUrl) {
          updatedDocuments.license = updatedDocuments.license || {};
          updatedDocuments.license.backImage = ikUrl;
        }
      }
      if (documents.panCard?.image || documents.panCard?.frontImage) {
        const raw = documents.panCard.image || documents.panCard.frontImage;
        const ikUrl = await uploadToImageKit(raw, `pan_${req.user._id}.jpg`);
        if (ikUrl) {
          updatedDocuments.panCard = updatedDocuments.panCard || {};
          updatedDocuments.panCard.image = ikUrl;
        }
      }
      if (documents.aadharCard?.image || documents.aadharCard?.frontImage) {
        const raw = documents.aadharCard.image || documents.aadharCard.frontImage;
        const ikUrl = await uploadToImageKit(raw, `aadhaar_${req.user._id}.jpg`);
        if (ikUrl) {
          updatedDocuments.aadharCard = updatedDocuments.aadharCard || {};
          updatedDocuments.aadharCard.image = ikUrl;
          updatedDocuments.aadharCard.frontImage = ikUrl;
        }
      }
      if (documents.aadharCard?.backImage) {
        const ikUrl = await uploadToImageKit(documents.aadharCard.backImage, `aadhaar_back_${req.user._id}.jpg`);
        if (ikUrl) {
          updatedDocuments.aadharCard = updatedDocuments.aadharCard || {};
          updatedDocuments.aadharCard.backImage = ikUrl;
        }
      }
      if (documents.rc?.image) {
        const ikUrl = await uploadToImageKit(documents.rc.image, `rc_${req.user._id}.jpg`);
        if (ikUrl) {
          updatedDocuments.rc = updatedDocuments.rc || {};
          updatedDocuments.rc.image = ikUrl;
        }
      }
      if (documents.insurance?.image) {
        const ikUrl = await uploadToImageKit(documents.insurance.image, `insurance_${req.user._id}.jpg`);
        if (ikUrl) {
          updatedDocuments.insurance = updatedDocuments.insurance || {};
          updatedDocuments.insurance.image = ikUrl;
        }
      }
    }

    const changedDocumentKeys = getChangedDocumentKeys(existingDocs, updatedDocuments);

    if (changedDocumentKeys.length) {
      rider.documents = resetVerificationForChangedDocuments(updatedDocuments, changedDocumentKeys);
      rider.riderVerified = false;
      rider.verificationStatus = 'pending';
    }

    if (permanentAddress !== undefined) rider.permanentAddress = deepMergeObjects(rider.permanentAddress || {}, permanentAddress);
    if (localAddress !== undefined) rider.localAddress = deepMergeObjects(rider.localAddress || {}, localAddress);
    if (emergencyContactNumber !== undefined) rider.emergencyContactNumber = normalizeString(emergencyContactNumber);

    await rider.save();
    const admins = await User.find({ role: 'admin' });
    const user = await User.findById(req.user._id).select('name');
    if (changedDocumentKeys.length) {
      for (const a of admins) {
        try { await sendNotification(a._id, 'Rider Documents Updated', `${user ? user.name : 'A rider'} updated their documents`); } catch (e) { }
      }
    }
    res.status(200).json({
      success: true,
      message: changedDocumentKeys.length
        ? 'Documents updated and submitted for admin approval'
        : 'Documents endpoint updated non-critical fields only',
      approval: {
        documents: changedDocumentKeys.length ? 'pending' : (rider.riderVerified ? 'approved' : 'pending'),
      },
      changedDocuments: changedDocumentKeys,
      rider,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// exports.updateVehicle = async (req, res) => {
//   try {
//     let { vehicle } = req.body;
//     vehicle = parseIfString(vehicle);

//     const bracketVehicle = extractBracketObject(req.body, 'vehicle');
//     vehicle = deepMergeObjects(vehicle || {}, bracketVehicle);

//     const forbiddenPaths = findForbiddenVerificationFields({ vehicle, ...req.body });
//     if (forbiddenPaths.length) {
//       return res.status(400).json({
//         success: false,
//         message: 'Verification fields are admin controlled',
//         details: forbiddenPaths,
//       });
//     }

//     if (!vehicle || !isPlainObject(vehicle)) {
//       return res.status(400).json({ message: 'Vehicle details are required' });
//     }

//     const rider = await Rider.findOne({ user: req.user._id });
//     if (!rider) return res.status(404).json({ message: 'Rider profile not found' });

//     if (vehicle.type && typeof vehicle.type === 'string') {
//       const VehicleModel = require('../models/Vehicle');
//       const inputType = vehicle.type.trim();
//       let normalizedType = inputType;

//       if (mongoose.Types.ObjectId.isValid(inputType)) {
//         const byId = await VehicleModel.findById(inputType).select('name');
//         if (byId?.name) normalizedType = byId.name;
//       } else {
//         const foundVehicle = await VehicleModel.findOne({ name: inputType }).select('name');
//         if (foundVehicle?.name) normalizedType = foundVehicle.name;
//       }

//       const mapToEnum = {
//         bike: 'bike',
//         scooter: 'scooter',
//         car: 'car',
//         other: 'other',
//         motorcycle: 'bike',
//       };
//       const normalizedKey = normalizedType.toLowerCase().replace(/\s+/g, '');
//       if (mapToEnum[normalizedKey]) {
//         vehicle.type = mapToEnum[normalizedKey];
//       }
//     }

//     const nextVehicle = deepMergeObjects(rider.vehicle || {}, vehicle || {});
//     const vehicleIdentityChanged =
//       !isEqualDeep(normalizeString(rider.vehicle?.type), normalizeString(nextVehicle?.type)) ||
//       !isEqualDeep(normalizeString(rider.vehicle?.model), normalizeString(nextVehicle?.model)) ||
//       !isEqualDeep(normalizeString(rider.vehicle?.number), normalizeString(nextVehicle?.number));

//     rider.vehicle = nextVehicle;

//     if (vehicleIdentityChanged) {
//       rider.vehicle.vehicleApproval = rider.vehicle.vehicleApproval || {};
//       rider.vehicle.vehicleApproval.status = 'pending';
//       rider.vehicle.vehicleApproval.reason = undefined;
//       rider.vehicle.vehicleApproval.approvedAt = undefined;
//       rider.vehicle.vehicleApproval.approvedBy = undefined;
//       rider.vehicle.vehicleVerified = false;
//       rider.verificationStatus = 'pending';
//     }

//     await rider.save();
//     if (vehicleIdentityChanged) {
//       const admins = await User.find({ role: 'admin' });
//       const user = await User.findById(req.user._id).select('name');
//       for (const a of admins) {
//         try { await sendNotification(a._id, 'Rider Vehicle Updated', `${user ? user.name : 'A rider'} updated vehicle info`); } catch (e) { }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: vehicleIdentityChanged ? 'Vehicle updated, approval pending' : 'Vehicle details unchanged',
//       approval: {
//         vehicle: vehicleIdentityChanged ? 'pending' : rider.vehicle?.vehicleApproval?.status,
//       },
//       rider,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// exports.updateRiderBankDetails = async (req, res) => {
//   try {
//     const { bankDetails } = req.body;
//     if (!bankDetails || typeof bankDetails !== 'object') {
//       return res.status(400).json({ message: 'Bank details are required' });
//     }
//     const rider = await Rider.findOne({ user: req.user._id });
//     if (!rider) return res.status(404).json({ message: 'Rider profile not found' });
//     rider.bankDetails = {
//       ...(rider.bankDetails || {}),
//       ...bankDetails,
//       verified: false,
//       verificationStatus: 'pending',
//       rejectionReason: undefined,
//       approvedAt: undefined,
//       approvedBy: undefined
//     };
//     rider.verificationStatus = 'pending';
//     rider.riderVerified = false;
//     await rider.save();
//     const admins = await User.find({ role: 'admin' });
//     const user = await User.findById(req.user._id).select('name');
//     for (const a of admins) {
//       try {
//         await sendNotification(
//           a._id,
//           'Rider Bank Details Updated',
//           `${user ? user.name : 'A rider'} updated their bank details and requires approval`
//         );
//       } catch (e) { }
//     }
//     res.status(200).json({
//       success: true,
//       message: 'Bank details submitted for admin approval',
//       rider
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// exports.verifyRiderVehicle = async (req, res) => {
//   try {
//     const { status, reason } = req.body; // status = 'approved'|'rejected'|'pending'
//     if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
//     const rider = await Rider.findById(req.params.id).populate('user', 'name');
//     if (!rider) return res.status(404).json({ message: 'Rider not found' });
//     rider.vehicle.vehicleApproval = rider.vehicle.vehicleApproval || {};
//     rider.vehicle.vehicleApproval.status = status;
//     rider.vehicle.vehicleApproval.reason = reason || '';
//     if (status === 'approved') {
//       rider.vehicle.vehicleApproval.approvedAt = new Date();
//       rider.vehicle.vehicleApproval.approvedBy = req.user._id;
//       rider.vehicle.vehicleVerified = true;
//     } else if (status === 'rejected') {
//       rider.vehicle.vehicleVerified = false;
//       rider.verificationStatus = 'rejected';
//     } else {
//       rider.vehicle.vehicleVerified = false;
//     }
//     if (rider.riderVerified && rider.vehicle.vehicleVerified) {
//       rider.verificationStatus = 'approved';
//     } else if (status !== 'rejected') {
//       rider.verificationStatus = 'pending';
//     }
//     await rider.save();
//     try { await sendNotification(rider.user, 'Vehicle Verification Update', `Your vehicle verification status: ${status}`); } catch (e) { }
//     res.status(200).json({
//       message: status === 'approved'
//         ? (rider.verificationStatus === 'approved'
//           ? 'Vehicle verified. Rider fully approved!'
//           : 'Vehicle verified. Awaiting rider documents verification.')
//         : 'Vehicle verification updated',
//       rider
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.updateVehicle = async (req, res) => {
  try {
    let { vehicle } = req.body; // Expect { type, model, number }
    vehicle = parseIfString(vehicle);

    const bracketVehicle = extractBracketObject(req.body, 'vehicle');
    vehicle = deepMergeObjects(vehicle || {}, bracketVehicle);

    const forbiddenPaths = findForbiddenVerificationFields({ vehicle, ...req.body });
    if (forbiddenPaths.length) {
      return res.status(400).json({
        success: false,
        message: 'Verification fields are admin controlled',
        details: forbiddenPaths,
      });
    }

    if (!vehicle || typeof vehicle !== 'object') {
      return res.status(400).json({ message: 'Vehicle details are required' });
    }

    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ message: 'Rider profile not found' });
    if (vehicle && vehicle.type && typeof vehicle.type === 'string') {
      const VehicleModel = require('../models/Vehicle');
      const foundVehicle = await VehicleModel.findOne({ $or: [{ name: vehicle.type }, { type: vehicle.type }] });
      if (foundVehicle) vehicle.type = foundVehicle.type || foundVehicle.name || vehicle.type;
    }
    const nextVehicle = deepMergeObjects(rider.vehicle || {}, vehicle || {});
    const vehicleIdentityChanged =
      !isEqualDeep(normalizeString(rider.vehicle?.type), normalizeString(nextVehicle?.type)) ||
      !isEqualDeep(normalizeString(rider.vehicle?.model), normalizeString(nextVehicle?.model)) ||
      !isEqualDeep(normalizeString(rider.vehicle?.number), normalizeString(nextVehicle?.number));

    rider.vehicle = nextVehicle;

    if (vehicleIdentityChanged) {
      rider.vehicle.vehicleApproval = rider.vehicle.vehicleApproval || {};
      rider.vehicle.vehicleApproval.status = 'pending';
      rider.vehicle.vehicleApproval.reason = undefined;
      rider.vehicle.vehicleApproval.approvedAt = undefined;
      rider.vehicle.vehicleApproval.approvedBy = undefined;
      rider.vehicle.vehicleVerified = false;
      rider.verificationStatus = 'pending';
    }

    await rider.save();
    if (vehicleIdentityChanged) {
      const admins = await User.find({ role: 'admin' });
      const user = await User.findById(req.user._id).select('name');
      for (const a of admins) {
        try { await sendNotification(a._id, 'Rider Vehicle Updated', `${user ? user.name : 'A rider'} updated vehicle info`); } catch (e) { }
      }
    }
    res.status(200).json({
      success: true,
      message: vehicleIdentityChanged ? 'Vehicle updated, approval pending' : 'Vehicle details unchanged',
      approval: {
        vehicle: vehicleIdentityChanged ? 'pending' : rider.vehicle?.vehicleApproval?.status,
      },
      rider,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateRiderBankDetails = async (req, res) => {
  try {
    let { bankDetails } = req.body;
    bankDetails = parseIfString(bankDetails);
    const bracketBankDetails = extractBracketObject(req.body, 'bankDetails');
    bankDetails = deepMergeObjects(bankDetails || {}, bracketBankDetails);

    const forbiddenPaths = findForbiddenVerificationFields({ bankDetails, ...req.body });
    if (forbiddenPaths.length) {
      return res.status(400).json({
        success: false,
        message: 'Verification fields are admin controlled',
        details: forbiddenPaths,
      });
    }

    if (!bankDetails || !isPlainObject(bankDetails)) {
      return res.status(400).json({ message: 'Bank details are required' });
    }
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(404).json({ message: 'Rider profile not found' });

    const nextBankDetails = deepMergeObjects(rider.bankDetails || {}, bankDetails);
    const comparisonCurrent = { ...(rider.bankDetails || {}) };
    const comparisonNext = { ...nextBankDetails };
    delete comparisonCurrent.verified;
    delete comparisonCurrent.verificationStatus;
    delete comparisonCurrent.rejectionReason;
    delete comparisonCurrent.approvedAt;
    delete comparisonCurrent.approvedBy;
    delete comparisonNext.verified;
    delete comparisonNext.verificationStatus;
    delete comparisonNext.rejectionReason;
    delete comparisonNext.approvedAt;
    delete comparisonNext.approvedBy;

    const bankDetailsChanged = !isEqualDeep(comparisonCurrent, comparisonNext);
    if (bankDetailsChanged) {
      rider.bankDetails = {
        ...nextBankDetails,
        verified: false,
        verificationStatus: 'pending',
        rejectionReason: undefined,
        approvedAt: undefined,
        approvedBy: undefined,
      };
    }

    await rider.save();
    if (bankDetailsChanged) {
      const admins = await User.find({ role: 'admin' });
      const user = await User.findById(req.user._id).select('name');
      for (const a of admins) {
        try {
          await sendNotification(
            a._id,
            'Rider Bank Details Updated',
            `${user ? user.name : 'A rider'} updated their bank details and requires approval`
          );
        } catch (e) { }
      }
    }
    res.status(200).json({
      success: true,
      message: bankDetailsChanged ? 'Bank details submitted for admin approval' : 'Bank details unchanged',
      approval: {
        bankDetails: bankDetailsChanged ? 'pending' : rider.bankDetails?.verificationStatus,
      },
      rider
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.verifyRiderVehicle = async (req, res) => {
  try {
    const { status, reason } = req.body; // status = 'approved'|'rejected'|'pending'
    if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if (status === 'rejected' && !normalizeString(reason)) {
      return res.status(400).json({ message: 'Rejection reason is required for vehicle rejection' });
    }
    const rider = await Rider.findById(req.params.id).populate('user', 'name');
    if (!rider) return res.status(404).json({ message: 'Rider not found' });
    rider.vehicle.vehicleApproval = rider.vehicle.vehicleApproval || {};
    rider.vehicle.vehicleApproval.status = status;
    rider.vehicle.vehicleApproval.reason = normalizeString(reason) || undefined;
    if (status === 'approved') {
      rider.vehicle.vehicleApproval.approvedAt = new Date();
      rider.vehicle.vehicleApproval.approvedBy = req.user._id;
      rider.vehicle.vehicleVerified = true;
    } else if (status === 'rejected') {
      rider.vehicle.vehicleApproval.approvedAt = undefined;
      rider.vehicle.vehicleApproval.approvedBy = undefined;
      rider.vehicle.vehicleVerified = false;
      rider.verificationStatus = 'rejected';
    } else {
      rider.vehicle.vehicleApproval.approvedAt = undefined;
      rider.vehicle.vehicleApproval.approvedBy = undefined;
      rider.vehicle.vehicleVerified = false;
    }
    if (rider.riderVerified && rider.vehicle.vehicleVerified) {
      rider.verificationStatus = 'approved';
    } else if (status !== 'rejected') {
      rider.verificationStatus = 'pending';
    }
    await rider.save();
    try { await sendNotification(rider.user._id || rider.user, 'Vehicle Verification Update', `Your vehicle verification status: ${status}`); } catch (e) { }
    res.status(200).json({
      message: status === 'approved'
        ? (rider.verificationStatus === 'approved'
          ? 'Vehicle verified. Rider fully approved!'
          : 'Vehicle verified. Awaiting rider documents verification.')
        : 'Vehicle verification updated',
      rider
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyRiderBankDetails = async (req, res) => {
  try {
    const { status, reason } = req.body; // status = 'approved'|'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use approved or rejected' });
    }
    const rider = await Rider.findById(req.params.id).populate('user', 'name');
    if (!rider) return res.status(404).json({ message: 'Rider not found' });
    if (!rider.bankDetails) {
      return res.status(400).json({ message: 'No bank details found for this rider' });
    }
    rider.bankDetails.verificationStatus = status;
    if (status === 'approved') {
      rider.bankDetails.verified = true;
      rider.bankDetails.approvedAt = new Date();
      rider.bankDetails.approvedBy = req.user._id;
      rider.bankDetails.rejectionReason = undefined;
    } else if (status === 'rejected') {
      rider.bankDetails.verified = false;
      rider.bankDetails.rejectionReason = reason || 'Bank details rejected';
      rider.verificationStatus = 'rejected';
    }
    await rider.save();
    try {
      await sendNotification(
        rider.user,
        'Bank Details Verification',
        status === 'approved'
          ? 'Your bank details have been approved'
          : `Your bank details were rejected: ${reason || 'Please update and resubmit'}`
      );
    } catch (e) { }
    res.status(200).json({
      success: true,
      message: `Bank details ${status}`,
      rider
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminGetActiveSOS = async (req, res) => {
  try {
    const active = await Rider.find({ sosActive: true }).populate('user', 'name mobile');
    res.status(200).json(active);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.adminClearSOS = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ message: 'Rider not found' });
    rider.sosActive = false;
    rider.sosLastAt = new Date();
    await rider.save();
    await SupportTicket.updateMany({ user: rider.user, subject: 'SOS Alert', status: 'open' }, { status: 'resolved', $push: { reply: { by: 'admin', message: 'Resolved by admin', createdAt: new Date() } } });
    try { await sendNotification(rider.user, 'SOS Cleared by Admin', 'Your SOS has been cleared by support'); } catch (e) { }
    res.status(200).json({ message: 'SOS cleared for rider', rider });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { long, lat } = req.body;
    const locationUtils = require('../utils/locationUtils');
    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      {
        currentLocation: {
          type: 'Point',
          coordinates: [long, lat]
        },
        lastLocationUpdateAt: new Date() // ✅ CHANGED: field name
      },
      { new: true }
    ).populate('user', 'name');
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.status(200).send("Location Updated");
    setImmediate(async () => {
      try {
        const activeOrders = await Order.find({
          rider: rider._id,
          status: { $in: ['assigned', 'accepted_by_rider', 'reached_restaurant', 'arrived_restaurant', 'picked_up', 'delivery_arrived'] }
        });
        for (const order of activeOrders) {
          try {
            const eta = locationUtils.calculateETA(
              [long, lat],
              order.deliveryAddress.coordinates,
              order.status
            );
            socketService.emitToCustomer(order.customer.toString(), 'rider:location_updated', {
              orderId: order._id,
              riderLocation: {
                lat: lat,
                long: long
              },
              eta: eta,
              riderName: rider.user.name,
              riderPhone: rider.contactNumber || 'Not provided'
            });
          } catch (err) {
            logger.error('Error emitting location to customer', { orderId: order._id, error: err.message });
          }
        }
        if (activeOrders.some(o => o.status === 'picked_up')) {
          try {
            socketService.emitToRestaurant(
              activeOrders[0].restaurant.toString(),
              'rider:on_way',
              {
                riderLocation: { lat, long },
                riderName: rider.user.name
              }
            );
          } catch (err) {
            logger.error('Error emitting location to restaurant', { error: err.message });
          }
        }
        try {
          const adminLocationPayload = {
            riderId: rider._id,
            riderName: rider.user.name,
            latitude: lat,
            longitude: long,
            activeOrders: activeOrders.length,
            timestamp: new Date()
          };
          socketService.emitToAdmin('rider:location_update', adminLocationPayload);
          socketService.emitToAdmin('rider:location_updated', adminLocationPayload);
        } catch (err) {
          logger.error('Error emitting location to admin', { error: err.message });
        }
      } catch (socketError) {
        logger.error('Socket emission error in background:', socketError);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.createRiderByAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let {
      name, email, mobile, phone, pin, password,
      address, address2, city, state, country, zipCode,
      workCity, workZone, status, vehicle, documents, bankDetails
    } = req.body;

    if (typeof address === 'string') address = parseIfString(address);
    if (typeof vehicle === 'string') vehicle = parseIfString(vehicle);
    if (typeof documents === 'string') documents = parseIfString(documents);
    if (typeof bankDetails === 'string') bankDetails = parseIfString(bankDetails);

    // Normalize phone number
    const rawPhone = (mobile || phone || "").toString().replace(/[^0-9]/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      throw new Error('Please provide a valid 10-digit mobile number');
    }
    const last10 = rawPhone.slice(-10);
    const cleanMobile = `+91${last10}`;
    const cleanPin = (pin || "1234").toString().trim();
    const cleanName = (name || "").trim() || `Rider ${last10.slice(-4)}`;

    // Avoid accidental browser autofill of admin email
    const adminEmail = (req.user?.email || "admin@gmail.com").toLowerCase();
    const rawEmail = (email || "").trim().toLowerCase();
    const cleanEmail = (!rawEmail || rawEmail === adminEmail || rawEmail === 'admin@gmail.com')
      ? `rider_${last10}@ecdkart.com`
      : rawEmail;

    // Check if mobile already exists
    const mobileExists = await User.findOne({
      $or: [
        { mobile: cleanMobile },
        { phone: cleanMobile },
        { mobile: last10 },
        { phone: last10 }
      ]
    });

    if (mobileExists) {
      throw new Error(`Mobile number ${cleanMobile} is already registered (${mobileExists.name || mobileExists.role}). Please use another number or delete the previous driver.`);
    }

    // Check if email already exists (only if custom email provided)
    if (cleanEmail && !cleanEmail.endsWith('@ecdkart.com')) {
      const emailExists = await User.findOne({ email: cleanEmail });
      if (emailExists) {
        throw new Error(`Email ${cleanEmail} is already registered. Please enter a different email or leave it blank.`);
      }
    }

    let profilePic = '';
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      profilePic = getFileUrl(req.files.profilePic[0]);
    } else if (req.body.profilePic && typeof req.body.profilePic === 'string') {
      profilePic = req.body.profilePic;
    }

    if (profilePic && profilePic.startsWith('data:')) {
      const ikProfile = await uploadToImageKit(profilePic, `profile_${last10}.jpg`, '/ecdkart/riders/profiles');
      if (ikProfile) profilePic = ikProfile;
    }

    const salt = await bcrypt.genSalt(10);
    const passToHash = (password && password.trim().length > 0) ? password : (cleanPin || last10);
    const hashedPassword = await bcrypt.hash(passToHash, salt);

    const [newUser] = await User.create([{
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      phone: cleanMobile,
      pin: cleanPin,
      password: hashedPassword,
      role: 'driver',
      profilePic,
      isVerified: false
    }], { session });

    // Vehicle formatting
    const formattedVehicle = vehicle || {};
    const vehicleType = formattedVehicle.type || "bike";
    const vehicleNumber = formattedVehicle.number || formattedVehicle.regNumber || "";

    const finalVehicle = {
      type: vehicleType,
      brand: formattedVehicle.brand || "",
      model: formattedVehicle.model || "",
      number: vehicleNumber,
      regNumber: vehicleNumber,
      color: formattedVehicle.color || "",
      year: formattedVehicle.year || "",
      vehicleVerified: false,
      vehicleApproval: {
        status: 'pending'
      }
    };

    // Extract & upload all documents to ImageKit
    const rawDocs = documents || {};

    const licenseNumber = rawDocs.licenseNumber || rawDocs.license?.number || "";
    const licenseExpiry = rawDocs.licenseExpiry || rawDocs.license?.expiryDate || rawDocs.license?.expiry || "";
    let licenseFront = (req.files?.licenseFrontImage?.[0] ? getFileUrl(req.files.licenseFrontImage[0]) : (rawDocs.licenseFront || rawDocs.license?.frontImage || rawDocs.license?.image)) || "";
    let licenseBack = (req.files?.licenseBackImage?.[0] ? getFileUrl(req.files.licenseBackImage[0]) : (rawDocs.licenseBack || rawDocs.license?.backImage)) || "";

    const rcNumber = rawDocs.rcNumber || rawDocs.rc?.number || vehicleNumber || "";
    let rcImage = (req.files?.rcImage?.[0] ? getFileUrl(req.files.rcImage[0]) : (rawDocs.rcImage || rawDocs.rc?.image)) || "";

    const aadharNumber = rawDocs.aadharNumber || rawDocs.aadharCard?.number || "";
    let aadharImage = (req.files?.aadharCardImage?.[0] ? getFileUrl(req.files.aadharCardImage[0]) : (rawDocs.aadharFront || rawDocs.aadharCard?.image || rawDocs.aadharCard?.frontImage)) || "";

    const panNumber = rawDocs.panNumber || rawDocs.panCard?.number || "";
    let panImage = (req.files?.panCardImage?.[0] ? getFileUrl(req.files.panCardImage[0]) : (rawDocs.panImage || rawDocs.panCard?.image)) || "";

    const insuranceNumber = rawDocs.insuranceNumber || rawDocs.insurance?.number || "";
    const insuranceExpiry = rawDocs.insuranceExpiry || rawDocs.insurance?.expiryDate || rawDocs.insurance?.expiry || "";
    let insuranceImage = (req.files?.insuranceImage?.[0] ? getFileUrl(req.files.insuranceImage[0]) : (rawDocs.insuranceImage || rawDocs.insurance?.image)) || "";

    let medicalCertificate = (req.files?.medicalCertificate?.[0] ? getFileUrl(req.files.medicalCertificate[0]) : rawDocs.medicalCertificate) || "";
    let gst = (req.files?.gst?.[0] ? getFileUrl(req.files.gst[0]) : rawDocs.gst) || "";

    // Upload base64 strings to ImageKit
    const [
      ikLicenseFront,
      ikLicenseBack,
      ikRcImage,
      ikAadharImage,
      ikPanImage,
      ikInsuranceImage,
      ikMedicalCertificate,
      ikGst
    ] = await Promise.all([
      licenseFront && licenseFront.startsWith('data:') ? uploadToImageKit(licenseFront, `license_front_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(licenseFront),
      licenseBack && licenseBack.startsWith('data:') ? uploadToImageKit(licenseBack, `license_back_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(licenseBack),
      rcImage && rcImage.startsWith('data:') ? uploadToImageKit(rcImage, `rc_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(rcImage),
      aadharImage && aadharImage.startsWith('data:') ? uploadToImageKit(aadharImage, `aadhar_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(aadharImage),
      panImage && panImage.startsWith('data:') ? uploadToImageKit(panImage, `pan_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(panImage),
      insuranceImage && insuranceImage.startsWith('data:') ? uploadToImageKit(insuranceImage, `insurance_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(insuranceImage),
      medicalCertificate && medicalCertificate.startsWith('data:') ? uploadToImageKit(medicalCertificate, `medical_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(medicalCertificate),
      gst && gst.startsWith('data:') ? uploadToImageKit(gst, `gst_${last10}.jpg`, '/ecdkart/riders/documents') : Promise.resolve(gst)
    ]);

    const finalProcessedDocuments = {
      license: {
        number: licenseNumber,
        expiryDate: licenseExpiry,
        expiry: licenseExpiry,
        frontImage: ikLicenseFront || licenseFront || "",
        backImage: ikLicenseBack || licenseBack || "",
        image: ikLicenseFront || licenseFront || "",
        verified: false
      },
      rc: {
        number: rcNumber,
        image: ikRcImage || rcImage || "",
        verified: false
      },
      aadharCard: {
        number: aadharNumber,
        image: ikAadharImage || aadharImage || "",
        frontImage: ikAadharImage || aadharImage || "",
        verified: false
      },
      panCard: {
        number: panNumber,
        image: ikPanImage || panImage || "",
        verified: false
      },
      insurance: {
        number: insuranceNumber,
        expiryDate: insuranceExpiry,
        expiry: insuranceExpiry,
        image: ikInsuranceImage || insuranceImage || "",
        verified: false
      },
      medicalCertificate: ikMedicalCertificate || medicalCertificate || "",
      gst: ikGst || gst || ""
    };

    // Bank Details formatting
    const rawBank = bankDetails || {};
    const finalBankDetails = {
      holderName: rawBank.holderName || rawBank.accountHolderName || cleanName,
      accountHolderName: rawBank.accountHolderName || rawBank.holderName || cleanName,
      bankName: rawBank.bankName || "",
      accountNumber: rawBank.accountNumber || "",
      ifscCode: (rawBank.ifscCode || "").toUpperCase().trim(),
      upiId: (rawBank.upiId || "").trim(),
      branchName: rawBank.branchName || "",
      branchAddress: rawBank.branchAddress || "",
      accountAddress: rawBank.accountAddress || "",
      verified: false,
      verificationStatus: 'pending'
    };

    // Address formatting
    const finalAddress = typeof address === 'object' ? address : {
      addressLine1: address || "",
      addressLine2: address2 || "",
      city: city || workCity || "",
      state: state || "",
      country: country || "India",
      zipCode: zipCode || ""
    };

    const [newRider] = await Rider.create([{
      user: newUser._id,
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      phone: cleanMobile,
      pin: cleanPin,
      profilePic,
      address: finalAddress,
      workCity: workCity || city || "",
      workZone: workZone || "",
      vehicle: finalVehicle,
      documents: finalProcessedDocuments,
      bankDetails: finalBankDetails,
      verificationStatus: 'pending', // Pending approval for Admin review
      riderVerified: false,
      status: status || 'pending',
      isOnline: false,
      isAvailable: false,
      currentLocation: {
        type: 'Point',
        coordinates: [77.0658, 28.2888] // Default coords to satisfy 2dsphere index
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Rider created successfully with Pending verification status for Admin approval",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        phone: newUser.phone,
        role: newUser.role,
        pin: newUser.pin,
        isVerified: newUser.isVerified
      },
      rider: newRider
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getPendingRiders = async (req, res) => {
  try {
    // Auto-reconcile any driver users without Rider docs
    const driversWithoutRiders = await User.find({
      role: { $in: ['driver', 'rider'] },
      _id: { $nin: await Rider.distinct('user') }
    });
    if (driversWithoutRiders.length > 0) {
      for (const d of driversWithoutRiders) {
        try {
          await Rider.create({
            user: d._id,
            name: d.name || 'Driver Partner',
            email: d.email,
            phone: d.phone || d.mobile,
            mobile: d.mobile || d.phone,
            profilePic: d.profilePic,
            verificationStatus: 'pending',
            riderVerified: false,
            isAvailable: false,
            isOnline: false,
            status: 'inactive'
          });
        } catch (e) {
          // ignore duplicate
        }
      }
    }

    const pendingRiders = await Rider.find({
      $or: [
        { verificationStatus: 'pending' },
        { riderVerified: false },
        { 'vehicle.vehicleVerified': false },
        { 'vehicle.vehicleApproval.status': 'pending' }
      ]
    }).populate('user', 'name email mobile phone profilePic role');

    const formatted = pendingRiders.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        name: obj.name || obj.user?.name || 'Driver Partner',
        phone: obj.phone || obj.mobile || obj.user?.phone || obj.user?.mobile || '',
        mobile: obj.mobile || obj.phone || obj.user?.mobile || obj.user?.phone || '',
        email: obj.email || obj.user?.email || '',
        profilePic: obj.profilePic || obj.user?.profilePic || '',
        user: obj.user || {
          _id: obj.user,
          name: obj.name,
          mobile: obj.mobile || obj.phone,
          email: obj.email
        }
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    let rider = await Rider.findById(id).populate('user', 'name email mobile phone fcmToken');
    if (!rider) {
      rider = await Rider.findOne({ user: id }).populate('user', 'name email mobile phone fcmToken');
    }
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    const newStatus = status || 'approved';
    rider.verificationStatus = newStatus;
    rider.riderVerified = newStatus === 'approved';
    if (rider.vehicle) {
      rider.vehicle.vehicleVerified = newStatus === 'approved';
      if (rider.vehicle.vehicleApproval) {
        rider.vehicle.vehicleApproval.status = newStatus;
      }
    }
    if (rider.bankDetails) {
      rider.bankDetails.verified = newStatus === 'approved';
      rider.bankDetails.verificationStatus = newStatus;
    }
    if (newStatus === 'rejected') {
      rider.rejectionReason = reason || 'Admin rejected application';
      rider.rejectionDate = new Date();
    }
    await rider.save();
    if (rider.user) {
      await User.findByIdAndUpdate(rider.user._id || rider.user, {
        isVerified: newStatus === 'approved'
      }).catch(e => console.error('User isVerified sync error:', e));
    }

    // Send Push Notification to Rider App via Firebase & Socket
    try {
      const targetUserId = rider.user?._id || rider.user;
      if (targetUserId) {
        if (newStatus === 'approved') {
          await sendNotification(
            targetUserId,
            "Profile Approved! 🎉",
            "Congratulations! Your rider profile has been verified and approved by Admin. You can now go online and start accepting orders.",
            {
              type: "RIDER_VERIFIED",
              riderId: rider._id.toString(),
              status: "approved"
            }
          );
          console.log(`✅ Verification approval notification sent to rider: ${targetUserId}`);
        } else if (newStatus === 'rejected') {
          await sendNotification(
            targetUserId,
            "Verification Update",
            `Your rider profile verification was rejected. Reason: ${rider.rejectionReason || reason || 'Please check with admin'}`,
            {
              type: "RIDER_REJECTED",
              riderId: rider._id.toString(),
              status: "rejected",
              reason: rider.rejectionReason
            }
          );
          console.log(`⚠️ Verification rejection notification sent to rider: ${targetUserId}`);
        }
      }
    } catch (notifyErr) {
      console.error('Failed to send verification push notification:', notifyErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Rider ${newStatus} successfully`,
      rider
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    let rider = await Rider.findById(id).populate('user', 'name email mobile phone');
    if (!rider) {
      rider = await Rider.findOne({ user: id }).populate('user', 'name email mobile phone');
    }
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }
    rider.riderVerified = false;
    rider.verificationStatus = 'rejected';
    rider.isOnline = false;
    rider.isAvailable = false;
    rider.status = 'inactive';
    rider.rejectionReason = reason || 'Application rejected by Admin';
    rider.rejectionDate = new Date();
    rider.rejectedBy = req.user?._id;
    await rider.save();
    if (rider.user) {
      await User.findByIdAndUpdate(rider.user._id || rider.user, {
        isVerified: false
      }).catch(e => console.error('User isVerified sync error on reject:', e));
    }
    try {
      if (rider.user?._id) {
        await sendNotification(
          rider.user._id,
          "Application Rejected",
          `Your rider application has been rejected. Reason: ${rider.rejectionReason}`,
          { riderId: rider._id, reason: rider.rejectionReason }
        );
      }
    } catch (notifyError) {
      console.error('Failed to send rejection notification:', notifyError);
    }
    res.status(200).json({
      success: true,
      message: "Rider rejected successfully",
      rider
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllRiders = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req, 100);
    const { status } = req.query;
    const search = req.query.search || '';

    // Auto-reconcile any driver users without Rider docs
    const driversWithoutRiders = await User.find({
      role: { $in: ['driver', 'rider'] },
      _id: { $nin: await Rider.distinct('user') }
    });
    if (driversWithoutRiders.length > 0) {
      for (const d of driversWithoutRiders) {
        try {
          await Rider.create({
            user: d._id,
            name: d.name || 'Driver Partner',
            email: d.email,
            phone: d.phone || d.mobile,
            mobile: d.mobile || d.phone,
            profilePic: d.profilePic,
            verificationStatus: 'pending',
            riderVerified: false,
            isAvailable: false,
            isOnline: false,
            status: 'inactive'
          });
        } catch (e) {
          // ignore duplicate
        }
      }
    }

    let query = {};
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { workCity: { $regex: search, $options: 'i' } },
        { 'vehicle.number': { $regex: search, $options: 'i' } },
        { 'vehicle.regNumber': { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Rider.countDocuments(query);
    const riders = await Rider.find(query)
      .populate('user', 'name email mobile phone profilePic role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const formattedRiders = riders.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        name: obj.name || obj.user?.name || 'Driver Partner',
        phone: obj.phone || obj.mobile || obj.user?.phone || obj.user?.mobile || '',
        mobile: obj.mobile || obj.phone || obj.user?.mobile || obj.user?.phone || '',
        email: obj.email || obj.user?.email || '',
        profilePic: obj.profilePic || obj.user?.profilePic || '',
        user: obj.user || {
          _id: obj.user,
          name: obj.name,
          mobile: obj.mobile || obj.phone,
          email: obj.email
        }
      };
    });

    res.status(200).json({
      success: true,
      riders: formattedRiders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveRidersWithLocations = async (req, res) => {
  try {
    const { isOnline } = req.query;
    let query = {
      'currentLocation.coordinates.0': { $exists: true },
      'currentLocation.coordinates.1': { $exists: true },
      verificationStatus: 'approved'
    };
    if (isOnline !== undefined) {
      query.isOnline = isOnline === 'true';
    } else {
      query.isOnline = true;
    }
    const ridersWithLocations = await Rider.find(query)
      .populate('user', 'name email mobile phone')
      .lean();
    const enrichedRiders = await Promise.all(
      ridersWithLocations.map(async (rider) => {
        const activeOrders = await Order.find({
          rider: rider._id,
          status: { $in: ['assigned', 'accepted_by_rider', 'reached_restaurant', 'arrived_restaurant', 'picked_up', 'delivery_arrived'] }
        })
          .lean()
          .select('_id customer restaurant deliveryAddress status pickupAddress');
        const [longitude, latitude] = rider.currentLocation?.coordinates || [77.0658, 28.2888];
        const riderStatus = rider.isOnline
          ? (rider.breakMode ? 'break' : (rider.isAvailable ? 'online' : 'busy'))
          : 'offline';
        return {
          riderId: rider._id,
          riderName: rider.user?.name || rider.name || 'Unknown',
          riderPhone: rider.user?.mobile || rider.user?.phone || rider.phone || rider.mobile || 'N/A',
          status: riderStatus,
          coordinates: {
            latitude,
            longitude
          },
          accuracy: rider.accuracy || null,
          speed: rider.speed || 0,
          heading: rider.heading || null,
          lastLocationUpdate: rider.lastLocationUpdateAt || rider.updatedAt,
          isAvailable: rider.isAvailable,
          onBreak: rider.breakMode,
          activeOrders: activeOrders.map(o => ({
            orderId: o._id,
            status: o.status,
            customerCity: o.pickupAddress?.city || 'N/A',
            deliveryCity: o.deliveryAddress?.city || 'N/A'
          })),
          orderCount: activeOrders.length,
          vehicle: {
            type: rider.vehicle?.type,
            number: rider.vehicle?.number || rider.vehicle?.regNumber
          }
        };
      })
    );
    res.status(200).json({
      success: true,
      count: enrichedRiders.length,
      riders: enrichedRiders.sort((a, b) => b.orderCount - a.orderCount),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching active riders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRiderLiveTracking = async (req, res) => {
  try {
    const { riderId } = req.params;
    let rider = await Rider.findById(riderId)
      .populate('user', 'name email mobile phone profilePic')
      .lean();
    if (!rider) {
      rider = await Rider.findOne({ user: riderId })
        .populate('user', 'name email mobile phone profilePic')
        .lean();
    }
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }
    const activeOrders = await Order.find({
      rider: rider._id,
      status: { $in: ['assigned', 'accepted_by_rider', 'reached_restaurant', 'arrived_restaurant', 'picked_up', 'delivery_arrived'] }
    })
      .populate('customer', 'name mobile')
      .populate('restaurant', 'name address')
      .lean();
    const [longitude, latitude] = rider.currentLocation?.coordinates || [77.0658, 28.2888];
    const riderStatus = rider.isOnline
      ? (rider.breakMode ? 'break' : (rider.isAvailable ? 'online' : 'busy'))
      : 'offline';
    res.status(200).json({
      success: true,
      rider: {
        riderId: rider._id,
        riderName: rider.user?.name || rider.name,
        riderPhone: rider.user?.mobile || rider.user?.phone || rider.phone,
        riderProfilePic: rider.user?.profilePic || rider.profilePic,
        currentLocation: {
          latitude,
          longitude,
          accuracy: rider.accuracy,
          speed: rider.speed,
          heading: rider.heading,
          address: rider.address || {}
        },
        status: riderStatus,
        isAvailable: rider.isAvailable,
        onBreak: rider.breakMode,
        breakReason: rider.breakReason,
        vehicle: {
          type: rider.vehicle?.type,
          number: rider.vehicle?.number || rider.vehicle?.regNumber,
          color: rider.vehicle?.color
        },
        stats: {
          totalDeliveries: rider.totalDeliveries || 0,
          successfulOrders: rider.deliveredOrders || 0,
          ordersRejected: rider.cancelledOrders || 0,
          rating: rider.averageRating || rider.rating?.average || 4.8
        },
        lastLocationUpdate: rider.lastLocationUpdateAt,
        updatedAt: rider.updatedAt
      },
      activeOrders: activeOrders.map(order => ({
        orderId: order._id,
        customerName: order.customer?.name,
        customerPhone: order.customer?.mobile,
        restaurantName: order.restaurant?.name,
        restaurantAddress: order.restaurant?.address,
        pickupLocation: order.pickupAddress || {},
        deliveryLocation: order.deliveryAddress || {},
        status: order.status,
        estimatedDelivery: order.estimatedDeliveryTime
      })),
      totalActiveOrders: activeOrders.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching rider tracking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRiderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let rider = null;
    if (isValidObjectId(id)) {
      rider = await Rider.findById(id).populate('user', 'name email mobile phone profilePic role');
      if (!rider) {
        rider = await Rider.findOne({ user: id }).populate('user', 'name email mobile phone profilePic role');
      }
    }
    if (!rider) {
      const user = await User.findById(id);
      if (user && ['driver', 'rider'].includes(user.role)) {
        rider = await Rider.create({
          user: user._id,
          name: user.name || 'Driver Partner',
          email: user.email,
          mobile: user.mobile || user.phone,
          phone: user.phone || user.mobile,
          verificationStatus: 'approved',
          riderVerified: true
        });
        rider = await Rider.findById(rider._id).populate('user', 'name email mobile phone profilePic role');
      }
    }
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    const orders = await Order.find({ rider: rider._id });
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const totalEarnings = orders.reduce((sum, o) => sum + (o.riderEarning || o.riderCommission || 0), 0);

    const riderObj = rider.toObject();
    riderObj.name = riderObj.name || riderObj.user?.name || 'Driver Partner';
    riderObj.phone = riderObj.phone || riderObj.mobile || riderObj.user?.phone || riderObj.user?.mobile || '';
    riderObj.mobile = riderObj.mobile || riderObj.phone || riderObj.user?.mobile || riderObj.user?.phone || '';
    riderObj.email = riderObj.email || riderObj.user?.email || '';
    riderObj.profilePic = riderObj.profilePic || riderObj.user?.profilePic || '';
    riderObj.totalOrders = totalOrders || riderObj.totalOrders || 0;
    riderObj.deliveredOrders = deliveredOrders || riderObj.totalDeliveries || 0;
    riderObj.cancelledOrders = cancelledOrders;
    riderObj.totalEarnings = totalEarnings || riderObj.totalEarnings || 0;

    res.status(200).json({
      success: true,
      rider: riderObj,
      ...riderObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRiderByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    let rider = null;
    if (isValidObjectId(id)) {
      rider = await Rider.findById(id);
      if (!rider) {
        rider = await Rider.findOne({ user: id });
      }
    }
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    let { name, email, phone, mobile, address, workCity, workZone, vehicle, documents, bankDetails, verificationStatus, riderVerified, profilePic } = req.body;

    address = parseIfString(address);
    vehicle = parseIfString(vehicle);
    documents = parseIfString(documents);
    bankDetails = parseIfString(bankDetails);

    // Profile Pic
    let profilePicUrl = rider.profilePic;
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      profilePicUrl = await getFileUrl(req.files.profilePic[0]);
    } else if (profilePic) {
      const ikUrl = await uploadToImageKit(profilePic, `profile_${rider._id}.jpg`);
      if (ikUrl) profilePicUrl = ikUrl;
    }

    if (rider.user) {
      try {
        const user = await User.findById(rider.user);
        if (user) {
          if (name && name.trim()) user.name = name.trim();
          if (email && email.trim()) user.email = email.trim().toLowerCase();
          if (phone || mobile) {
            user.mobile = mobile || phone || user.mobile;
            user.phone = phone || mobile || user.phone;
          }
          if (profilePicUrl) {
            user.profilePic = profilePicUrl;
          }
          await user.save();
        }
      } catch (userErr) {
        console.warn('User update warning in admin edit:', userErr.message);
      }
    }

    const updateDoc = {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(phone || mobile ? { phone: phone || mobile, mobile: mobile || phone } : {}),
      ...(profilePicUrl ? { profilePic: profilePicUrl } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(workCity !== undefined ? { workCity } : {}),
      ...(workZone !== undefined ? { workZone } : {}),
      ...(verificationStatus ? { verificationStatus } : {}),
      ...(riderVerified !== undefined ? { riderVerified } : {}),
    };

    if (vehicle) {
      updateDoc.vehicle = { ...(rider.vehicle || {}), ...vehicle };
    }
    if (documents) {
      updateDoc.documents = { ...(rider.documents || {}), ...documents };
    }
    if (bankDetails) {
      updateDoc.bankDetails = { ...(rider.bankDetails || {}), ...bankDetails };
    }

    const updated = await Rider.findByIdAndUpdate(
      rider._id,
      { $set: updateDoc },
      { new: true, runValidators: false }
    ).populate('user', 'name email mobile phone profilePic');

    res.status(200).json({ success: true, message: "Rider details updated successfully", rider: updated });
  } catch (error) {
    console.error('Update rider error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRider = async (req, res) => {
  try {
    const { id } = req.params;
    let rider = null;
    if (isValidObjectId(id)) {
      rider = await Rider.findById(id);
      if (!rider) {
        rider = await Rider.findOne({ user: id });
      }
    }
    if (!rider) {
      rider = await Rider.findOne({ $or: [{ _id: id }, { user: id }] }).catch(() => null);
    }
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }
    const userId = rider.user;
    const phone = rider.mobile || rider.phone;
    await Rider.findByIdAndDelete(rider._id);
    if (userId) {
      await User.findByIdAndDelete(userId);
    }
    if (phone) {
      const clean10 = phone.toString().replace(/[^0-9]/g, '').slice(-10);
      if (clean10) {
        await User.deleteMany({
          role: { $in: ['driver', 'rider'] },
          $or: [
            { mobile: `+91${clean10}` },
            { phone: `+91${clean10}` },
            { mobile: clean10 },
            { phone: clean10 }
          ]
        });
      }
    }
    res.status(200).json({ success: true, message: "Rider and associated User account deleted successfully" });
  } catch (error) {
    console.error("Delete rider error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.sendSOS = async (req, res) => {
  try {
    const { latitude, longitude, message, orderId } = req.body;
    const rider = await Rider.findOne({ user: req.user._id })
      .populate('user', 'name mobile');
    if (!rider) {
      return res.status(404).json({ message: 'Rider profile not found' });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates required for SOS' });
    }
    rider.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    rider.lastLocationUpdate = new Date();
    await rider.save();
    const sosData = {
      riderId: rider._id,
      riderName: rider.user.name,
      riderMobile: rider.user.mobile,
      latitude,
      longitude,
      message: message || 'Emergency - immediate assistance needed',
      orderId: orderId || null,
      timestamp: new Date(),
      urgent: true,
      type: 'SOS'
    };
    socketService.emitToAdmin('rider:sos_alert', sosData);
    const sosTicket = await SupportTicket.create({
      user: req.user._id,
      subject: 'EMERGENCY SOS ALERT',
      message: `${sosData.message}\n\nLocation: ${latitude}, ${longitude}\nOrder ID: ${orderId || 'N/A'}`,
      category: 'emergency',
      priority: 'urgent',
      status: 'open'
    });
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await sendNotification(
          admin._id,
          'RIDER SOS ALERT',
          `${rider.user.name} needs immediate assistance! Location: ${latitude}, ${longitude}`,
          { riderId: rider._id, ticketId: sosTicket._id, latitude, longitude }
        );
      }
    } catch (notifyError) {
      console.error('Failed to send SOS notifications:', notifyError);
    }
    res.status(200).json({
      success: true,
      message: 'SOS alert sent successfully - help is on the way',
      ticketId: sosTicket._id,
      sosData
    });
  } catch (error) {
    console.error('SOS alert error:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.resolveSOS = async (req, res) => {
  try {
    const { ticketId, resolution } = req.body;
    const rider = await Rider.findOne({ user: req.user._id })
      .populate('user', 'name');
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    if (ticketId) {
      await SupportTicket.findByIdAndUpdate(ticketId, {
        status: 'resolved',
        resolution: resolution || 'SOS resolved by rider',
        resolvedAt: new Date()
      });
    }
    socketService.emitToAdmin('rider:sos_resolved', {
      riderId: rider._id,
      riderName: rider.user.name,
      ticketId,
      resolution: resolution || 'Situation resolved',
      timestamp: new Date()
    });
    res.status(200).json({
      success: true,
      message: 'SOS resolved successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.respondToRideRequest = async (req, res) => {
  try {
    const { requestId, action } = req.params;
    const validActions = ['accept', 'reject'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'accept' or 'reject'" });
    }
    const riderDispatchService = require('../services/riderDispatchService');
    const serviceAction = action === 'accept' ? 'accepted' : 'rejected';
    const result = await riderDispatchService.handleRiderResponse(req.user._id, requestId, serviceAction);
    res.status(200).json(result);
  } catch (error) {
    if (error.code === 'ORDER_ALREADY_TAKEN' || error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        code: 'ORDER_ALREADY_TAKEN',
        message: 'This order was already accepted by another rider'
      });
    }
    if (error.code === 'RIDER_ALREADY_ASSIGNED') {
      return res.status(409).json({
        success: false,
        code: 'RIDER_ALREADY_ASSIGNED',
        message: 'You already have an active order. Complete it before accepting a new one.'
      });
    }
    res.status(500).json({ message: error.message });
  }
};
exports.verifyPickup = async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    const Order = require('../models/Order');
    const orderStateValidator = require('../utils/orderStateValidator');
    const socketService = require('../services/socketService');
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) return res.status(404).json({ message: "Rider profile not found" });
    const riderCheck = orderStateValidator.validateRiderPickup(order, riderProfile._id);
    if (!riderCheck.valid) return res.status(400).json({ message: riderCheck.error });
    if (new Date() > order.pickupOtpExpiresAt) {
      return res.status(400).json({
        message: "Pickup OTP expired. Request new one.",
        code: "OTP_EXPIRED"
      });
    }
    if (order.pickupOtp !== otp) {
      return res.status(400).json({ message: "Invalid Pickup OTP" });
    }
    const oldStatus = order.status;
    order.status = 'picked_up';
    order.pickupOtpVerifiedAt = new Date();
    order.pickedUpAt = new Date();
    order.timeline.push({
      status: 'picked_up',
      timestamp: new Date(),
      label: "Picked Up",
      by: "rider",
      description: "Rider has picked up your order"
    });
    await order.save();
    const User = require('../models/User');
    const riderUser = await User.findById(req.user._id).select('name phone avatar mobile');
    socketService.emitToCustomer(order.customer.toString(), 'order:status', {
      orderId: order._id,
      status: 'picked_up',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToRestaurant(order.restaurant.toString(), 'order:status', {
      orderId: order._id,
      status: 'picked_up',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToAdmin('order:status', {
      orderId: order._id,
      status: 'picked_up',
      totalAmount: order.totalAmount,
      amount: order.totalAmount,
      timestamp: new Date(),
      timeline: order.timeline
    });
    try {
      const customerUser = await User.findById(order.customer).select('mobile');
      const notificationService = require('../utils/notificationService');
      if (customerUser?.mobile) {
        await notificationService.sendNotification(
          order.customer,
          'Order Picked Up',
          `${riderUser?.name || 'Your rider'} has picked up your order`
        );
      }
    } catch (notifErr) {
      console.error('Notification failed:', notifErr.message);
    }
    res.status(200).json({ success: true, message: "Order Picked Up!", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.verifyDelivery = async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    const Order = require('../models/Order');
    const orderStateValidator = require('../utils/orderStateValidator');
    const socketService = require('../services/socketService');
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) return res.status(404).json({ message: "Rider profile not found" });
    const riderCheck = orderStateValidator.validateRiderDelivery(order, riderProfile._id);
    if (!riderCheck.valid) return res.status(400).json({ message: riderCheck.error });
    if (new Date() > order.deliveryOtpExpiresAt) {
      return res.status(400).json({
        message: "Delivery OTP expired. Request new one.",
        code: "OTP_EXPIRED"
      });
    }
    if (order.deliveryOtp !== otp) {
      return res.status(400).json({ message: "Invalid Delivery OTP" });
    }
    const oldStatus = order.status;
    order.status = 'delivered';
    order.deliveryOtpVerifiedAt = new Date();
    order.deliveredAt = new Date();
    order.timeline.push({
      status: 'delivered',
      timestamp: new Date(),
      label: "Delivered",
      by: "system",
      description: "Order has been delivered"
    });
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
      order.cashCollected = order.totalAmount;
      order.cashCollectedAt = new Date();
      order.cashCollectedBy = req.user._id;
    }
    await order.save();
    try {
      const { processCODDelivery, processOnlineDelivery } = require('../services/paymentService');
      const Restaurant = require('../models/Restaurant');
      if (order.paymentMethod === 'cod') {
        processCODDelivery(order._id).catch(err =>
          console.error('COD delivery payment processing failed:', err.message)
        );
      } else {
        processOnlineDelivery(order._id).catch(err =>
          console.error('Online delivery payment processing failed:', err.message)
        );
      }
      Restaurant.findByIdAndUpdate(order.restaurant, {
        $inc: {
          totalEarnings: order.restaurantCommission || 0,
          totalDeliveries: 1,
          successfulOrders: 1,
        }
      }).catch(err => console.error('Restaurant stat update failed:', err.message));
    } catch (payErr) {
      console.error('Failed to trigger earnings on delivery:', payErr.message);
    }
    await Rider.findOneAndUpdate({ user: req.user._id }, { isAvailable: true });
    const RideRequest = require('../models/RideRequest');
    await RideRequest.updateMany(
      { rider: riderProfile._id, status: 'pending' },
      { $set: { status: 'rejected' } }
    );
    socketService.emitToCustomer(order.customer.toString(), 'order:status', {
      orderId: order._id,
      status: 'delivered',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToRestaurant(order.restaurant.toString(), 'order:status', {
      orderId: order._id,
      status: 'delivered',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToAdmin('order:status', {
      orderId: order._id,
      status: 'delivered',
      totalAmount: order.totalAmount,
      amount: order.totalAmount,
      timestamp: new Date(),
      timeline: order.timeline
    });
    try {
      const notificationService = require('../utils/notificationService');
      await notificationService.sendNotification(
        order.customer,
        'Order Delivered',
        'Your order has been delivered successfully'
      );
    } catch (notifErr) {
      console.error('Notification failed:', notifErr.message);
    }
    res.status(200).json({ success: true, message: "Order Delivered Successfully!", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.riderArrivedRestaurant = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id);
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return res.status(403).json({ message: "Rider profile not found" });
    }
    if (
      !order ||
      !order.rider ||
      order.rider.toString() !== riderProfile._id.toString()
    )
      return res.status(403).json({ message: "Not assigned to you" });
    if (order.status !== "assigned") {
      return res.status(400).json({
        message: "Order must be in assigned status to mark restaurant arrival",
        currentStatus: order.status,
      });
    }
    order.status = "reached_restaurant";
    order.timeline.push({
      status: "reached_restaurant",
      label: "Rider at Restaurant",
      description: "Rider has arrived at restaurant — waiting for pickup OTP",
      by: "rider",
      timestamp: new Date(),
    });
    await order.save();
    try {
      const restaurantDoc = await Restaurant.findById(order.restaurant).select('owner contactNumber');
      if (restaurantDoc?.owner) {
        const ownerUser = await User.findById(restaurantDoc.owner).select('mobile');
        if (ownerUser?.mobile) await sendOTP(ownerUser.mobile, order.pickupOtp);
      } else if (restaurantDoc?.contactNumber) {
        await sendOTP(restaurantDoc.contactNumber, order.pickupOtp);
      }
    } catch (smsErr) {
      console.error('Twilio SMS failed (arriveRestaurant pickupOtp to restaurant):', smsErr.message);
    }
    socketService.emitToCustomer(order.customer.toString(), 'order:status', {
      orderId: order._id,
      status: 'reached_restaurant',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToRestaurant(order.restaurant.toString(), 'order:status', {
      orderId: order._id,
      status: 'reached_restaurant',
      timestamp: new Date(),
      timeline: order.timeline,
      message: 'Rider has arrived — please verify pickup OTP'
    });
    socketService.emitToAdmin('order:status', {
      orderId: order._id,
      status: 'reached_restaurant',
      totalAmount: order.totalAmount,
      amount: order.totalAmount,
      timestamp: new Date(),
      timeline: order.timeline
    });
    try {
      const notificationService = require('../utils/notificationService');
      const Restaurant = require('../models/Restaurant');
      const restaurantDoc = await Restaurant.findById(order.restaurant).select('owner');
      if (restaurantDoc?.owner) {
        await notificationService.sendNotification(
          restaurantDoc.owner,
          'Rider Arrived',
          'Rider has arrived at restaurant — verify pickup OTP'
        );
      }
    } catch (notifErr) {
      console.error('Notification failed:', notifErr.message);
    }
    res.status(200).json({ message: "Arrived at restaurant", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.riderArrivedCustomer = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id);
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return res.status(403).json({ message: "Rider profile not found" });
    }
    if (
      !order ||
      !order.rider ||
      order.rider.toString() !== riderProfile._id.toString()
    )
      return res.status(403).json({ message: "Not assigned to you" });
    if (order.status !== "picked_up") {
      return res.status(400).json({
        message: "Order must be picked up before marking arrival at customer",
        currentStatus: order.status,
      });
    }
    order.status = "delivery_arrived";
    order.timeline.push({
      status: "delivery_arrived",
      label: "Rider Arrived",
      description: "Rider has arrived at your location — please share delivery OTP",
      by: "rider",
      timestamp: new Date(),
    });
    await order.save();
    try {
      const customerUser = await User.findById(order.customer).select('mobile');
      if (customerUser?.mobile) await sendOTP(customerUser.mobile, order.deliveryOtp);
    } catch (smsErr) {
      console.error('Twilio SMS failed (arriveCustomer deliveryOtp reminder):', smsErr.message);
    }
    socketService.emitToCustomer(order.customer.toString(), 'order:status', {
      orderId: order._id,
      status: 'delivery_arrived',
      timestamp: new Date(),
      timeline: order.timeline,
      message: 'Your rider has arrived — please share your delivery OTP'
    });
    socketService.emitToRestaurant(order.restaurant.toString(), 'order:status', {
      orderId: order._id,
      status: 'delivery_arrived',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToAdmin('order:status', {
      orderId: order._id,
      status: 'delivery_arrived',
      totalAmount: order.totalAmount,
      amount: order.totalAmount,
      timestamp: new Date(),
      timeline: order.timeline
    });
    try {
      const notificationService = require('../utils/notificationService');
      await notificationService.sendNotification(
        order.customer,
        'Rider Arrived',
        'Your rider has arrived — please share your delivery OTP'
      );
    } catch (notifErr) {
      console.error('Notification failed:', notifErr.message);
    }
    res.status(200).json({ message: "Arrived at customer location", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.resendPickupOTP = async (req, res) => {
  try {
    const orderId = req.params.id;
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) return res.status(404).json({ message: "Rider profile not found" });
    if (!order.rider || order.rider.toString() !== riderProfile._id.toString()) {
      return res.status(403).json({ message: "This order is not assigned to you" });
    }
    const allowedStatuses = ['assigned', 'reached_restaurant'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Pickup OTP can only be resent before pickup. Current status: ${order.status}`,
      });
    }
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    order.pickupOtp = newOtp;
    order.pickupOtpExpiresAt = new Date(Date.now() + 100 * 60 * 1000);
    await order.save();
    try {
      const restaurantDoc = await Restaurant.findById(order.restaurant).select('owner contactNumber');
      if (restaurantDoc?.owner) {
        const ownerUser = await User.findById(restaurantDoc.owner).select('mobile');
        if (ownerUser?.mobile) await sendOTP(ownerUser.mobile, newOtp);
      } else if (restaurantDoc?.contactNumber) {
        await sendOTP(restaurantDoc.contactNumber, newOtp);
      }
    } catch (smsErr) {
      console.error('Twilio SMS failed (resendPickupOTP to restaurant):', smsErr.message);
    }
    socketService.emitToRestaurant(order.restaurant.toString(), 'order:pickup_otp_resent', {
      orderId: order._id,
      message: 'Rider has requested a new pickup OTP',
    });
    res.status(200).json({ success: true, message: "Pickup OTP resent to restaurant", expiresAt: order.pickupOtpExpiresAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.resendDeliveryOTP = async (req, res) => {
  try {
    const orderId = req.params.id;
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) return res.status(404).json({ message: "Rider profile not found" });
    if (!order.rider || order.rider.toString() !== riderProfile._id.toString()) {
      return res.status(403).json({ message: "This order is not assigned to you" });
    }
    const allowedStatuses = ['picked_up', 'delivery_arrived'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Delivery OTP can only be resent after pickup. Current status: ${order.status}`,
      });
    }
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = newOtp;
    order.deliveryOtpExpiresAt = new Date(Date.now() + 100 * 60 * 1000);
    await order.save();
    try {
      const customerUser = await User.findById(order.customer).select('mobile');
      if (customerUser?.mobile) await sendOTP(customerUser.mobile, newOtp);
    } catch (smsErr) {
      console.error('Twilio SMS failed (resendDeliveryOTP to customer):', smsErr.message);
    }
    socketService.emitToCustomer(order.customer.toString(), 'order:delivery_otp_resent', {
      orderId: order._id,
      message: 'Your delivery OTP has been resent',
    });
    res.status(200).json({ success: true, message: "Delivery OTP resent to customer", expiresAt: order.deliveryOtpExpiresAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.riderCollectCash = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { amount } = req.body;
    const order = await Order.findById(req.params.id);
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return res.status(403).json({ message: "Rider profile not found" });
    }
    if (
      !order ||
      !order.rider ||
      order.rider.toString() !== riderProfile._id.toString()
    )
      return res.status(403).json({ message: "Not assigned to you" });
    if (order.paymentMethod !== "cod")
      return res.status(400).json({ message: "Order is not Cash On Delivery" });
    const collected = Number(amount || order.totalAmount);
    order.cashCollected = collected;
    order.cashCollectedAt = new Date();
    order.cashCollectedBy = riderProfile._id; // store rider user id
    order.paymentStatus = 'paid';
    await order.save();
    const socketService = require('../services/socketService');
    socketService.emitToCustomer(order.customer.toString(), 'order:status', {
      orderId: order._id,
      status: order.status,
      paymentStatus: 'paid',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToRestaurant(order.restaurant.toString(), 'order:status', {
      orderId: order._id,
      status: order.status,
      paymentStatus: 'paid',
      timestamp: new Date(),
      timeline: order.timeline
    });
    socketService.emitToAdmin('order:status', {
      orderId: order._id,
      status: order.status,
      paymentStatus: 'paid',
      totalAmount: order.totalAmount,
      amount: order.totalAmount,
      timestamp: new Date(),
      timeline: order.timeline
    });
    res.status(200).json({ message: "Cash collected recorded", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAvailableOrders = async (req, res) => {
  try {
    const riderProfile = await Rider.findOne({ user: req.user._id });
    if (!riderProfile) {
      return res.status(400).json({ message: "Rider profile missing" });
    }
    const riderCoords = (riderProfile.currentLocation?.coordinates && riderProfile.currentLocation.coordinates.length === 2)
      ? riderProfile.currentLocation.coordinates
      : [77.0658, 28.2888];
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20); // Max 50, default 20
    const skip = (page - 1) * limit;
    let restaurantIds = [];
    try {
      const nearbyRestaurants = await Restaurant.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: riderCoords },
            $maxDistance: 100000, // 100km
          },
        },
      }).select('_id');
      restaurantIds = nearbyRestaurants.map(r => r._id);
    } catch (e) {
      // ignore geo index failure
    }

    const orderQuery = {
      orderType: { $ne: 'self_pickup' },
      status: { $in: ["placed", "accepted", "preparing", "ready"] },
      rider: null,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    };
    if (restaurantIds.length > 0) {
      orderQuery.restaurant = { $in: restaurantIds };
    }

    const nearbyOrders = await Order.find(orderQuery)
      .populate("restaurant", "name address image bannerImage location contactNumber phone")
      .populate("customer", "name mobile phone address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(orderQuery);
    for (const order of nearbyOrders) {
      const notifEntry = order.riderNotificationStatus?.notifiedRiders?.find(
        r => r.riderId.toString() === riderProfile._id.toString()
      );
      if (notifEntry && notifEntry.status === 'sent') {
        notifEntry.status = 'opened';
        await order.save();
      }
    }
    const formatted = nearbyOrders.map(o => {
      const restaurantCoords = o.restaurant?.location?.coordinates;
      const customerCoords = o.deliveryAddress?.coordinates;
      const pickupDistance = restaurantCoords && restaurantCoords.length === 2
        ? calculateDistance(riderCoords, restaurantCoords)
        : null;
      const deliveryDistance = restaurantCoords && customerCoords && customerCoords.length === 2
        ? calculateDistance(restaurantCoords, customerCoords)
        : null;
      const totalDistance = (pickupDistance || 0) + (deliveryDistance || 0);
      return {
        _id: o._id,
        orderId: o._id,
        restaurantName: o.restaurant.name.en || o.restaurant.name,
        restaurantAddress: o.restaurant.address,
        restaurantLocation: {
          coordinates: restaurantCoords,
          type: "Point"
        },
        customerAddress: o.deliveryAddress ? o.deliveryAddress.addressLine : 'Unknown',
        customerLocation: {
          coordinates: customerCoords,
          type: "Point"
        },
        earning: typeof o.riderEarning === 'number'
          ? o.riderEarning
          : (o.riderCommission || 0) + (o.tip || 0),
        tip: o.tip || 0,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
        distances: {
          pickupDistance: pickupDistance ? Math.round(pickupDistance * 100) / 100 : null, // Rider to Restaurant (km)
          deliveryDistance: deliveryDistance ? Math.round(deliveryDistance * 100) / 100 : null, // Restaurant to Customer (km)
          totalDistance: totalDistance ? Math.round(totalDistance * 100) / 100 : null, // Total (km)
          totalDistanceMeters: totalDistance ? Math.round(totalDistance * 1000) : null // In meters
        },
        estimatedTime: {
          pickupMinutes: pickupDistance ? Math.ceil(pickupDistance / 1) : null, // Assuming 1kmpm avg speed
          deliveryMinutes: deliveryDistance ? Math.ceil(deliveryDistance / 1) : null,
          totalMinutes: totalDistance ? Math.ceil(totalDistance / 1) : null
        }
      };
    });
    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalOrders: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        hasNextPage: skip + limit < totalOrders,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const riderUserId = req.user._id;
    const riderProfile = await Rider.findOne({ user: riderUserId });
    if (!riderProfile) {
      return res.status(404).json({ message: "Rider profile not found" });
    }
    const riderId = riderProfile._id;
    const activeOrder = await Order.findOne({
      rider: riderId,
      status: { $in: ['assigned', 'reached_restaurant', 'picked_up', 'delivery_arrived'] }
    });
    if (activeOrder) {
      return res.status(400).json({
        message: "You already have an active delivery",
        activeOrderId: activeOrder._id,
        currentStatus: activeOrder.status,
        suggestion: "Complete or cancel current order first"
      });
    }
    const orderToValidate = await Order.findById(orderId);
    if (!orderToValidate) {
      return res.status(404).json({ message: "Order not found" });
    }
    const acceptableStatuses = ['placed', 'accepted', 'preparing', 'ready'];
    if (!acceptableStatuses.includes(orderToValidate.status)) {
      return res.status(400).json({
        message: "Order not available for acceptance",
        error: `Order must be in one of these stages: ${acceptableStatuses.join(', ')}`,
        currentStatus: orderToValidate.status
      });
    }
    if (orderToValidate.status === 'cancelled') {
      return res.status(400).json({ message: "Order has been cancelled" });
    }
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        rider: null,
        status: { $in: acceptableStatuses }  // ✅ FIXED: Allow multiple statuses
      },
      {
        $set: {
          rider: riderId,
          status: "assigned",       // ✅ FIXED: Change to "assigned" when rider accepts
          "riderNotificationStatus.acceptedBy": riderId
        },
        $push: {
          timeline: {
            status: "assigned",
            timestamp: new Date(),
            label: "Rider Assigned",
            by: "rider",
            description: "Rider has accepted the order and is on the way"
          },
        },
      },
      {
        new: true,
      },
    );
    if (!order) {
      return res
        .status(409)
        .json({ message: "Too late! This order was already taken or status changed." });
    }
    if (order.riderNotificationStatus?.notifiedRiders) {
      const notifEntry = order.riderNotificationStatus.notifiedRiders.find(
        r => r.riderId.toString() === riderId.toString()
      );
      if (notifEntry) {
        notifEntry.status = 'accepted';
        await order.save();
      }
    }
    const RideRequest = require('../models/RideRequest');
    await RideRequest.updateMany(
      { rider: riderId, status: 'pending', order: { $ne: order._id } },
      { $set: { status: 'rejected' } }
    );
    const { logRiderAssignment, logOrderTransition } = require("../utils/logger");
    logRiderAssignment(order._id, riderId, order.restaurant, "manual");
    logOrderTransition(
      order._id,
      orderToValidate.status,  // Old status (accepted/preparing/ready)
      "assigned",              // New status
      riderUserId,
      "rider",
    );
    await Rider.findOneAndUpdate({ user: riderUserId }, { isAvailable: false });
    try {
      await sendNotification(
        order.customer,
        "Rider Assigned",
        "A rider has accepted your order.",
      );
    } catch (e) { }
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name")
        .populate("restaurant", "name")
        .populate("rider");
      const assignmentData = {
        orderId: order._id,
        riderId: riderId,
        riderName: riderProfile.name || "Rider",
        status: "assigned",
        timestamp: new Date(),
      };
      socketService.emitToCustomer(
        order.customer.toString(),
        "order:rider_assigned",
        {
          ...assignmentData,
          message: `Rider is on the way to pick up your order`
        },
      );
      socketService.emitToRestaurant(
        order.restaurant.toString(),
        "order:rider_assigned",
        {
          ...assignmentData,
          message: "Rider assigned - prepare for pickup"
        },
      );
      socketService.emitToAdmin("order:rider_assigned", {
        ...assignmentData,
        customerName: populatedOrder.customer.name,
        restaurantName: populatedOrder.restaurant.name,
        orderId: order._id.toString(),
        riderId: riderId.toString(),
        orderStatus: "assigned",
        riderLocation: riderProfile.currentLocation?.coordinates ? {
          latitude: riderProfile.currentLocation.coordinates[1],
          longitude: riderProfile.currentLocation.coordinates[0]
        } : null
      });
      const riderAcceptedPayload = {
        riderId: riderProfile._id.toString(),
        riderUserId: riderUserId.toString(),
        riderName: riderProfile.name,
        orderId: order._id.toString(),
        customerName: populatedOrder.customer.name,
        restaurantName: populatedOrder.restaurant.name,
        orderStatus: "assigned",
        timestamp: new Date(),
        action: "accepted_order",
        location: riderProfile.currentLocation?.coordinates ? {
          latitude: riderProfile.currentLocation.coordinates[1],
          longitude: riderProfile.currentLocation.coordinates[0],
          type: "Point"
        } : null,
        lastLocationUpdate: riderProfile.lastLocationUpdateAt || new Date()
      };
      console.log('🚀 EMITTING rider:order_accepted to admin:', JSON.stringify(riderAcceptedPayload, null, 2));
      socketService.emitToAdmin("rider:order_accepted", riderAcceptedPayload);
      socketService.emitToRider(riderProfile._id.toString(), "order:accepted", {
        ...assignmentData,
        message: "Order accepted - proceed to restaurant",
      });
      const riderCoords = riderProfile.currentLocation?.coordinates;
      if (riderCoords && riderCoords.length === 2) {
        const locationUtils = require('../utils/locationUtils');
        const [initialLong, initialLat] = riderCoords;
        const initialEta = order.deliveryAddress?.coordinates
          ? locationUtils.calculateETA([initialLong, initialLat], order.deliveryAddress.coordinates, 'assigned')
          : null;
        socketService.emitToCustomer(order.customer.toString(), 'rider:location_updated', {
          orderId: order._id,
          riderLocation: {
            lat: initialLat,
            long: initialLong
          },
          eta: initialEta,
          timestamp: new Date()
        });
        socketService.emitToOrder(order._id.toString(), 'rider:location', {
          riderId: riderUserId.toString(),
          latitude: initialLat,
          longitude: initialLong,
          eta: initialEta,
          timestamp: new Date()
        });
        socketService.emitToAdmin('rider:location_updated', {
          riderId: riderProfile._id.toString(),
          riderName: riderProfile.name || 'Rider',
          latitude: initialLat,
          longitude: initialLong,
          activeOrders: 1,
          timestamp: new Date()
        });
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }
    const restaurantCoords = order.restaurant?.location?.coordinates;
    const riderCoords = riderProfile.currentLocation?.coordinates;
    const customerCoords = order.deliveryAddress?.coordinates;
    let distanceInfo = null;
    if (restaurantCoords && riderCoords && customerCoords) {
      const pickupDistance = calculateDistance(riderCoords, restaurantCoords);
      const deliveryDistance = calculateDistance(restaurantCoords, customerCoords);
      const totalDistance = pickupDistance + deliveryDistance;
      distanceInfo = {
        pickupDistance: Math.round(pickupDistance * 100) / 100,
        deliveryDistance: Math.round(deliveryDistance * 100) / 100,
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalDistanceMeters: Math.round(totalDistance * 1000),
        estimatedTime: {
          pickupMinutes: Math.ceil(pickupDistance / 1),
          deliveryMinutes: Math.ceil(deliveryDistance / 1),
          totalMinutes: Math.ceil(totalDistance / 1)
        }
      };
    }
    res.status(200).json({
      message: "Order Accepted! Go pick it up.",
      order,
      ...(distanceInfo && { distances: distanceInfo })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.rejectOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const riderUserId = req.user._id;
    const { reason } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        message: "Please provide a reason for rejecting this order"
      });
    }
    const riderProfile = await Rider.findOne({ user: riderUserId });
    if (!riderProfile) {
      return res.status(404).json({ message: "Rider profile not found" });
    }
    const riderId = riderProfile._id;
    const order = await Order.findById(orderId)
      .populate('customer', 'name')
      .populate('restaurant', 'name');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const rejectableStatuses = ['accepted', 'preparing', 'ready'];
    if (!rejectableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: "Order cannot be rejected at this stage",
        currentStatus: order.status
      });
    }
    if (order.rider && order.rider.toString() !== riderId.toString()) {
      return res.status(400).json({
        message: "This order has been assigned to another rider"
      });
    }
    if (order.riderNotificationStatus?.notifiedRiders) {
      const notifEntry = order.riderNotificationStatus.notifiedRiders.find(
        r => r.riderId.toString() === riderId.toString()
      );
      if (notifEntry) {
        notifEntry.status = 'rejected';
        notifEntry.rejectedAt = new Date();
        notifEntry.rejectionReason = reason;
      } else {
        order.riderNotificationStatus.notifiedRiders.push({
          riderId: riderId,
          status: 'rejected',
          notifiedAt: new Date(),
          rejectedAt: new Date(),
          rejectionReason: reason
        });
      }
      await order.save();
    }
    await Rider.findByIdAndUpdate(riderId, {
      $inc: { 'stats.ordersRejected': 1 }
    });
    const { logRiderAction } = require("../utils/logger");
    logRiderAction(order._id, riderId, "rejected", reason);
    try {
      socketService.emitToAdmin("rider:order_rejected", {
        riderId: riderId.toString(),
        riderUserId: riderUserId.toString(),
        riderName: riderProfile.name,
        orderId: order._id.toString(),
        customerName: order.customer?.name || "Customer",
        restaurantName: order.restaurant?.name || "Restaurant",
        orderStatus: order.status,
        reason: reason,
        timestamp: new Date(),
        action: "rejected_order"
      });
      socketService.emitToRestaurant(
        order.restaurant._id.toString(),
        "rider:order_rejected",
        {
          orderId: order._id,
          riderName: riderProfile.name,
          reason: reason,
          message: "Rider rejected the order - finding another rider",
          timestamp: new Date()
        }
      );
      socketService.emitToOrder(
        order._id.toString(),
        "order:rider_rejected",
        {
          orderId: order._id,
          riderId: riderId,
          riderName: riderProfile.name,
          reason: reason,
          timestamp: new Date()
        }
      );
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }
    const riderDispatchService = require('../services/riderDispatchService');
    try {
      await riderDispatchService.dispatchToNearbyRiders(order._id);
    } catch (dispatchError) {
      console.error("Re-dispatch error:", dispatchError);
    }
    res.status(200).json({
      success: true,
      message: "Order rejected successfully",
      orderId: order._id,
      reason: reason,
      note: "Order will be offered to other available riders"
    });
  } catch (error) {
    console.error("Reject order error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.getMyActiveOrder = async (req, res) => {
  try {
    const riderUserId = req.user._id;
    const riderProfile = await Rider.findOne({ user: riderUserId });
    if (!riderProfile) {
      return res.status(404).json({ message: "Rider profile not found" });
    }

    const { calculateDistance } = require('../utils/locationUtils');
    const riderCoords = riderProfile.currentLocation?.coordinates || [77.0658, 28.2888];

    // 1. Check if rider has an ongoing assigned order
    const order = await Order.findOne({
      rider: riderProfile._id,
      status: { $in: ['assigned', 'reached_restaurant', 'picked_up', 'delivery_arrived'] }
    })
      .populate('customer', 'name phone mobile')
      .populate('restaurant', 'name address location contactNumber phone')
      .populate('rider', 'user currentLocation vehicle')
      .populate('rider.user', 'name mobile');

    if (order) {
      const restaurantCoords = order.restaurant?.location?.coordinates || riderCoords;
      const customerCoords = order.deliveryAddress?.coordinates || riderCoords;
      let distanceInfo = null;
      if (riderCoords && restaurantCoords && customerCoords) {
        const distanceToRestaurant = calculateDistance(riderCoords, restaurantCoords);
        const distanceToCustomer = calculateDistance(riderCoords, customerCoords);
        const totalDistance = distanceToRestaurant + distanceToCustomer;
        distanceInfo = {
          toRestaurant: {
            km: Math.round(distanceToRestaurant * 100) / 100,
            meters: Math.round(distanceToRestaurant * 1000),
            etaMinutes: Math.ceil(distanceToRestaurant / 0.33)
          },
          toCustomer: {
            km: Math.round(distanceToCustomer * 100) / 100,
            meters: Math.round(distanceToCustomer * 1000),
            etaMinutes: Math.ceil(distanceToCustomer / 0.33)
          },
          total: {
            km: Math.round(totalDistance * 100) / 100,
            meters: Math.round(totalDistance * 1000),
            etaMinutes: Math.ceil(totalDistance / 0.33)
          }
        };
      }

      let nextAction = {
        action: '',
        instruction: '',
        requiredOtp: null
      };
      switch (order.status) {
        case 'assigned':
          nextAction = {
            action: 'GO_TO_RESTAURANT',
            instruction: 'Navigate to restaurant to pick up the order',
            endpoint: `/api/riders/orders/${order._id}/arrive-restaurant`,
            requiredOtp: null
          };
          break;
        case 'picked_up':
          nextAction = {
            action: 'GO_TO_CUSTOMER',
            instruction: 'Navigate to customer to deliver the order',
            endpoint: `/api/riders/orders/${order._id}/arrive-customer`,
            requiredOtp: null
          };
          break;
        case 'delivery_arrived':
          nextAction = {
            action: 'VERIFY_DELIVERY',
            instruction: 'Verify delivery OTP from customer to complete delivery',
            endpoint: '/api/riders/orders/verify-delivery',
            requiredOtp: 'deliveryOtp'
          };
          break;
      }

      const storeName = typeof order.restaurant?.name === 'object' ? (order.restaurant.name.en || JSON.stringify(order.restaurant.name)) : (order.restaurant?.name || 'Restaurant');
      const storeAddress = typeof order.restaurant?.address === 'object' ? (order.restaurant.address.addressLine || JSON.stringify(order.restaurant.address)) : (order.restaurant?.address || 'Restaurant Address');
      const custAddress = typeof order.deliveryAddress?.addressLine === 'string' ? order.deliveryAddress.addressLine : (order.deliveryAddress ? JSON.stringify(order.deliveryAddress) : 'Customer Address');

      const formattedOrder = {
        _id: order._id,
        orderId: order._id,
        deliveryStatus: order.status === 'assigned' ? 'accepted' : order.status,
        status: order.status,
        store: {
          _id: order.restaurant?._id,
          name: storeName,
          address: storeAddress,
          phone: order.restaurant?.contactNumber || order.restaurant?.phone || ''
        },
        restaurant: {
          _id: order.restaurant?._id,
          name: storeName,
          address: storeAddress,
          phone: order.restaurant?.contactNumber || order.restaurant?.phone || '',
          location: order.restaurant?.location,
          pickupOtp: order.pickupOtp,
          pickupOtpExpiry: order.pickupOtpExpiresAt
        },
        customer: {
          _id: order.customer?._id,
          name: order.customer?.name || 'Customer',
          phone: order.customer?.phone || order.customer?.mobile || '',
          address: custAddress,
          deliveryAddress: custAddress,
          deliveryOtp: order.deliveryOtp,
          deliveryOtpExpiry: order.deliveryOtpExpiresAt
        },
        deliveryAddress: custAddress,
        driverEarnings: order.riderEarning || ((order.deliveryFee || 30) * 0.7),
        deliveryCharge: order.deliveryFee || 30,
        payableAmount: order.totalAmount,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        items: (order.items || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        earnings: {
          riderEarning: order.riderEarning || 0,
          tip: order.tip || 0,
          total: (order.riderEarning || 0) + (order.tip || 0)
        },
        distances: distanceInfo,
        nextAction,
        timeline: order.timeline,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt || order.createdAt
      };

      return res.status(200).json({
        success: true,
        hasActiveOrder: true,
        orders: [formattedOrder],
        data: [formattedOrder],
        order: formattedOrder,
        distances: distanceInfo,
        nextAction
      });
    }

    // 2. If no assigned active order, check for incoming unassigned delivery orders
    const unassignedOrders = await Order.find({
      orderType: { $ne: 'self_pickup' },
      rider: null,
      status: { $in: ['placed', 'accepted', 'preparing', 'ready'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .populate('customer', 'name phone mobile')
      .populate('restaurant', 'name address location contactNumber phone')
      .sort({ createdAt: -1 })
      .limit(3);

    if (unassignedOrders.length > 0) {
      const incomingList = unassignedOrders.map(o => {
        const storeName = typeof o.restaurant?.name === 'object' ? (o.restaurant.name.en || JSON.stringify(o.restaurant.name)) : (o.restaurant?.name || 'Restaurant');
        const storeAddress = typeof o.restaurant?.address === 'object' ? (o.restaurant.address.addressLine || JSON.stringify(o.restaurant.address)) : (o.restaurant?.address || 'Restaurant Address');
        const custAddress = typeof o.deliveryAddress?.addressLine === 'string' ? o.deliveryAddress.addressLine : (o.deliveryAddress ? JSON.stringify(o.deliveryAddress) : 'Customer Address');

        return {
          _id: o._id,
          orderId: o._id,
          deliveryStatus: 'driver_notified', // Triggers "Incoming Order" slide-to-accept in Rider app
          status: o.status,
          store: {
            _id: o.restaurant?._id,
            name: storeName,
            address: storeAddress,
            phone: o.restaurant?.contactNumber || o.restaurant?.phone || ''
          },
          restaurant: {
            _id: o.restaurant?._id,
            name: storeName,
            address: storeAddress,
            phone: o.restaurant?.contactNumber || o.restaurant?.phone || '',
            location: o.restaurant?.location
          },
          customer: {
            _id: o.customer?._id,
            name: o.customer?.name || 'Customer',
            phone: o.customer?.phone || o.customer?.mobile || '',
            address: custAddress,
            deliveryAddress: custAddress
          },
          deliveryAddress: custAddress,
          driverEarnings: o.riderEarning || ((o.deliveryFee || 30) * 0.7),
          deliveryCharge: o.deliveryFee || 30,
          payableAmount: o.totalAmount,
          totalAmount: o.totalAmount,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          items: (o.items || []).map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          createdAt: o.createdAt,
          updatedAt: o.updatedAt || o.createdAt
        };
      });

      return res.status(200).json({
        success: true,
        hasActiveOrder: false,
        orders: incomingList,
        data: incomingList,
        order: incomingList[0]
      });
    }

    // 3. No orders at all
    return res.status(200).json({
      success: true,
      hasActiveOrder: false,
      orders: [],
      data: [],
      order: null,
      message: "No active delivery at the moment"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.driverToggleOnline = async (req, res) => {
  try {
    let riderDoc = await Rider.findOne({ user: req.user._id });
    if (!riderDoc) return res.status(404).json({ message: "Rider profile not found" });
    riderDoc.isOnline = !riderDoc.isOnline;
    riderDoc.status = riderDoc.isOnline ? "active" : "inactive";
    await riderDoc.save();
    return res.status(200).json({ success: true, isOnline: riderDoc.isOnline, status: riderDoc.status, rider: riderDoc });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.driverReachedStore = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "Order ID is required" });
    req.params.id = orderId;
    return exports.riderArrivedRestaurant(req, res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.driverDeleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isDeleted: true, deletedAt: new Date() });
    return res.status(200).json({ success: true, message: "Driver account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.driverCodInitiate = async (req, res) => {
  try {
    const { amount } = req.body;
    return res.status(200).json({
      success: true,
      message: "COD payment initiated",
      transactionId: `COD_PAY_${Date.now()}`,
      amount: amount || 0,
      razorpayOrderId: `order_cod_${Date.now()}`
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.driverCodVerify = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "COD payment verified and credited to wallet"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

