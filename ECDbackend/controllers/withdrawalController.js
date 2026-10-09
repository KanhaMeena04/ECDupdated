const Withdrawal = require("../models/WithdrawalRequest");
const User = require("../models/User");
const Rider = require("../models/Rider");
const RiderWallet = require("../models/RiderWallet");
const Restaurant = require("../models/Restaurant");
const RestaurantWallet = require("../models/RestaurantWallet");
const SettlementLedger = require("../models/SettlementLedger");
const AuditLog = require("../models/AuditLog");
const { getPaginationParams } = require('../utils/pagination');
const { sendNotification } = require("../utils/notificationService");

// Get all withdrawals (Riders or Restaurants)
exports.getAllWithdrawals = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req, 50);
    const statusFilter = req.query.status;
    const requestType = req.query.requestType || 'rider';

    const query = {};
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    if (requestType === 'restaurant') {
      query.$or = [
        { requestType: 'restaurant' },
        { restaurant: { $exists: true, $ne: null } }
      ];
    } else if (requestType === 'rider') {
      query.$or = [
        { requestType: 'rider' },
        { requestType: { $exists: false }, rider: { $exists: true, $ne: null } },
        { rider: { $exists: true, $ne: null } }
      ];
    }

    const total = await Withdrawal.countDocuments(query);
    const requests = await Withdrawal.find(query)
      .populate("user", "name mobile email walletBalance upi role")
      .populate("rider", "_id vehicle bankDetails upiId verificationStatus riderId")
      .populate("restaurant", "_id name logo email contactNumber owner bankDetails upi settlementCycle walletBalance")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const mongoose = require('mongoose');
    const enriched = (await Promise.all(requests.map(async (doc) => {
      const obj = doc.toObject();

      const isRiderDoc = doc.rider != null || doc.requestType === 'rider';
      const isRestaurantReq = doc.requestType === 'restaurant' || (doc.restaurant != null && !isRiderDoc);

      if (requestType === 'restaurant' && !isRestaurantReq) {
        return null; // Exclude rider requests completely
      }

      if (requestType === 'rider' && !isRiderDoc) {
        return null; // Exclude restaurant requests completely
      }

      if (isRestaurantReq) {
        let rest = doc.restaurant;
        if (!rest && doc.user) {
          rest = await Restaurant.findOne({ owner: doc.user._id || doc.user }).select('_id name logo email contactNumber owner bankDetails upi settlementCycle walletBalance');
        }
        if (!rest && doc.restaurant) {
          if (mongoose.Types.ObjectId.isValid(doc.restaurant)) {
            rest = await Restaurant.findById(doc.restaurant).select('_id name logo email contactNumber owner bankDetails upi settlementCycle walletBalance');
          }
        }

        const w = rest ? await RestaurantWallet.findOne({ restaurant: rest._id }) : null;
        obj.restaurantProfile = rest || {
          name: doc.user?.name || 'Restaurant Partner',
          contactNumber: doc.user?.mobile || '',
          email: doc.user?.email || ''
        };
        obj.walletBalance = w?.balance ?? rest?.walletBalance ?? doc.user?.walletBalance ?? 0;
        obj.totalEarnings = w?.totalEarnings ?? rest?.totalEarnings ?? 0;
        obj.restaurantDisplayId = rest ? (rest.restaurantId || `REST-${rest._id.toString().slice(-6).toUpperCase()}`) : (doc.user?._id ? `USR-${doc.user._id.toString().slice(-6).toUpperCase()}` : 'N/A');

        const restBank = rest?.bankDetails || {};
        obj.bankDetails = {
          accountHolder: obj.bankDetails?.accountHolder || restBank.accountName || restBank.accountHolder || rest?.name || doc.user?.name || 'Restaurant Owner',
          bankName: obj.bankDetails?.bankName || restBank.bankName || 'Bank',
          accountNumber: obj.bankDetails?.accountNumber || restBank.accountNumber || '',
          ifsc: obj.bankDetails?.ifsc || obj.bankDetails?.ifscCode || restBank.ifsc || restBank.ifscCode || restBank.routingNumber || '',
          upiId: obj.bankDetails?.upiId || obj.bankDetails?.upi || rest?.upi || doc.user?.upi || '',
          phone: obj.bankDetails?.phone || rest?.contactNumber || doc.user?.mobile || ''
        };
      } else {
        let r = doc.rider;
        if (!r && doc.user) {
          r = await Rider.findOne({ user: doc.user._id || doc.user }).select('_id vehicle bankDetails upiId verificationStatus riderId');
        }
        const w = r ? await RiderWallet.findOne({ rider: r._id }) : null;
        obj.riderProfile = r || null;
        obj.walletBalance = w?.availableBalance ?? doc.user?.walletBalance ?? 0;
        obj.cashInHand = w?.cashInHand ?? 0;
        obj.totalEarnings = w?.totalEarnings ?? 0;
        obj.riderId = r ? (r.riderId || `RID-${r._id.toString().slice(-6).toUpperCase()}`) : (doc.user?._id || 'N/A');

        const rBank = r?.bankDetails || {};
        obj.bankDetails = {
          accountHolder: obj.bankDetails?.accountHolder || obj.bankDetails?.accountHolderName || rBank.accountHolder || rBank.accountHolderName || doc.user?.name || 'Rider',
          bankName: obj.bankDetails?.bankName || rBank.bankName || '',
          accountNumber: obj.bankDetails?.accountNumber || rBank.accountNumber || '',
          ifsc: obj.bankDetails?.ifsc || obj.bankDetails?.ifscCode || rBank.ifsc || rBank.ifscCode || '',
          upiId: obj.bankDetails?.upiId || obj.bankDetails?.upi || rBank.upiId || rBank.upi || doc.user?.upi || '',
          phone: obj.bankDetails?.phone || doc.user?.mobile || doc.user?.phone || ''
        };
      }

      return obj;
    }))).filter(Boolean);

    return res.status(200).json({
      success: true,
      withdrawals: enriched,
      total: enriched.length,
      page,
      limit,
      pages: Math.ceil(enriched.length / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Restaurant Payout Requests specifically
exports.getRestaurantWithdrawals = async (req, res) => {
  try {
    req.query.requestType = 'restaurant';
    return exports.getAllWithdrawals(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a Payout Request for a Restaurant
exports.createRestaurantWithdrawal = async (req, res) => {
  try {
    const { restaurantId, amount, method = 'upi', bankDetails } = req.body;
    const userId = req.user?._id || req.body.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid withdrawal amount is required' });
    }

    let restaurant = null;
    const mongoose = require('mongoose');
    if (restaurantId) {
      if (mongoose.Types.ObjectId.isValid(restaurantId)) {
        restaurant = await Restaurant.findById(restaurantId);
      }
      if (!restaurant) {
        restaurant = await Restaurant.findOne({
          $or: [
            { restaurantId: restaurantId },
            { contactNumber: restaurantId },
            { owner: restaurantId }
          ]
        });
      }
    }
    if (!restaurant && userId) {
      restaurant = await Restaurant.findOne({
        $or: [
          { owner: userId },
          { _id: userId }
        ]
      });
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    // Check restaurant wallet balance
    let rWallet = await RestaurantWallet.findOne({ restaurant: restaurant._id });
    if (!rWallet) {
      rWallet = await RestaurantWallet.create({ restaurant: restaurant._id, balance: restaurant.walletBalance || 0 });
    }

    const availableBalance = rWallet.balance ?? restaurant.walletBalance ?? 0;
    if (availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ₹${availableBalance}, Requested: ₹${amount}`
      });
    }

    const mergedBankDetails = {
      accountHolder: bankDetails?.accountHolder || restaurant.bankDetails?.accountName || restaurant.bankDetails?.accountHolder || restaurant.name,
      bankName: bankDetails?.bankName || restaurant.bankDetails?.bankName || '',
      accountNumber: bankDetails?.accountNumber || restaurant.bankDetails?.accountNumber || '',
      ifsc: bankDetails?.ifsc || bankDetails?.ifscCode || restaurant.bankDetails?.ifsc || restaurant.bankDetails?.routingNumber || '',
      upiId: bankDetails?.upiId || bankDetails?.upi || restaurant.upi || '',
      phone: bankDetails?.phone || restaurant.contactNumber || ''
    };

    const withdrawal = await Withdrawal.create({
      user: userId || restaurant.owner || req.user._id,
      restaurant: restaurant._id,
      requestType: 'restaurant',
      amount: Number(amount),
      method,
      bankDetails: mergedBankDetails,
      status: 'pending'
    });

    // Update pending amount in wallet
    rWallet.pendingAmount = (rWallet.pendingAmount || 0) + Number(amount);
    await rWallet.save();

    return res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      withdrawal
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Approve Payout Request (Supports both Rider & Restaurant)
exports.approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote, utrNumber, paidVia, paidToDetails } = req.body;
    const reqObj = await Withdrawal.findById(id);
    if (!reqObj) {
      return res.status(404).json({ success: false, message: "Withdrawal request not found" });
    }
    if (reqObj.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request is already ${reqObj.status}` });
    }

    const adminName = req.user?.name || req.user?.email || "ECD Admin";
    const selectedPaidVia = paidVia || reqObj.method || "upi";

    // Deduct from User wallet if applicable
    const user = await User.findById(reqObj.user);
    if (user && user.walletBalance >= reqObj.amount) {
      user.walletBalance -= reqObj.amount;
      await user.save();
    }

    // Handle Rider Wallet Payout
    if (reqObj.rider || reqObj.requestType === 'rider') {
      const riderId = reqObj.rider || (await Rider.findOne({ user: reqObj.user }))?._id;
      if (riderId) {
        const wallet = await RiderWallet.findOne({ rider: riderId });
        if (wallet) {
          wallet.availableBalance = Math.max(0, (wallet.availableBalance || 0) - reqObj.amount);
          wallet.totalPayouts = (wallet.totalPayouts || 0) + reqObj.amount;
          wallet.lastPayoutAt = new Date();
          wallet.lastPayoutAmount = reqObj.amount;
          await wallet.save();
        }
      }
    }

    // Handle Restaurant Wallet Payout
    if (reqObj.restaurant || reqObj.requestType === 'restaurant') {
      const restId = reqObj.restaurant || (await Restaurant.findOne({ owner: reqObj.user }))?._id;
      if (restId) {
        const restWallet = await RestaurantWallet.findOne({ restaurant: restId });
        if (restWallet) {
          restWallet.balance = Math.max(0, (restWallet.balance || 0) - reqObj.amount);
          restWallet.pendingAmount = Math.max(0, (restWallet.pendingAmount || 0) - reqObj.amount);
          restWallet.totalPaidOut = (restWallet.totalPaidOut || 0) + reqObj.amount;
          restWallet.lastPayoutAt = new Date();
          restWallet.lastPayoutAmount = reqObj.amount;
          await restWallet.save();
        }

        // Sync Restaurant model wallet balance
        const restDoc = await Restaurant.findById(restId);
        if (restDoc) {
          restDoc.walletBalance = Math.max(0, (restDoc.walletBalance || 0) - reqObj.amount);
          await restDoc.save();
        }

        // Also update any matching SettlementLedger items to PAID
        await SettlementLedger.updateMany(
          { restaurant: restId, status: { $in: ['CALCULATED', 'REVIEW', 'APPROVED', 'PROCESSING'] } },
          { $set: { status: 'PAID', paymentReference: utrNumber || `UTR-${Date.now()}`, settledAt: new Date() } }
        );
      }
    }

    reqObj.status = "approved";
    reqObj.approvedBy = adminName;
    reqObj.adminNote = adminNote || `Payout processed via ${selectedPaidVia.toUpperCase()} by ${adminName}`;
    reqObj.paidVia = selectedPaidVia;
    if (paidToDetails) reqObj.paidToDetails = paidToDetails;
    if (utrNumber) reqObj.utrNumber = utrNumber;
    reqObj.processedAt = new Date();
    await reqObj.save();

    // Prepare rich payout notification message
    const details = reqObj.paidToDetails || reqObj.bankDetails || {};
    const upiId = details.upiId || details.upi || user?.upi || "your UPI ID";
    const accNum = details.accountNumber ? String(details.accountNumber) : "";
    const accLast4 = accNum ? accNum.slice(-4) : "";
    const ifsc = details.ifsc || details.ifscCode || "";
    const bankName = details.bankName || "Bank";

    let notifTitle = `Payout Processed & Transferred! 💰`;
    let notifBody = "";

    if (selectedPaidVia === "upi") {
      notifBody = `₹${reqObj.amount} has been successfully transferred to your UPI ID (${upiId}).${utrNumber ? ` Ref/UTR: ${utrNumber}.` : ''} Approved by ${adminName}.`;
    } else if (selectedPaidVia === "bank") {
      notifBody = `₹${reqObj.amount} has been successfully transferred to your ${bankName} A/C ending in ${accLast4 || '****'}${ifsc ? ` (IFSC: ${ifsc})` : ''}.${utrNumber ? ` Ref/UTR: ${utrNumber}.` : ''} Approved by ${adminName}.`;
    } else {
      notifBody = `Your payout request of ₹${reqObj.amount} has been approved and paid by ${adminName}.${utrNumber ? ` Ref/UTR: ${utrNumber}.` : ''}`;
    }

    // Send push notification & socket event
    try {
      const targetUserId = reqObj.user?._id || reqObj.user;
      if (targetUserId) {
        await sendNotification(
          targetUserId,
          notifTitle,
          notifBody,
          {
            type: reqObj.requestType === 'restaurant' ? "RESTAURANT_PAYOUT_APPROVED" : "PAYOUT_APPROVED",
            withdrawalId: reqObj._id.toString(),
            amount: reqObj.amount.toString(),
            status: "approved",
            paidVia: selectedPaidVia,
            upiId: upiId,
            accountNumber: accNum,
            ifsc: ifsc,
            bankName: bankName,
            approvedBy: adminName,
            utrNumber: utrNumber || reqObj.utrNumber || "",
            adminNote: reqObj.adminNote || "",
            processedAt: reqObj.processedAt.toISOString()
          }
        );
      }
    } catch (notifErr) {
      console.error("Failed to send payout notification:", notifErr.message);
    }

    if (AuditLog && AuditLog.log) {
      await AuditLog.log({
        entity: 'Payout',
        entityId: reqObj._id,
        action: 'approve_payout',
        userId: req.user._id,
        userRole: req.user.role || 'admin',
        reason: `Payout of ₹${reqObj.amount} approved for ${reqObj.requestType}`,
        metadata: { utrNumber, paidVia: selectedPaidVia }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payout request approved successfully",
      request: reqObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reject Payout Request (Supports both Rider & Restaurant)
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote, reason } = req.body;
    const reqObj = await Withdrawal.findById(id);
    if (!reqObj) {
      return res.status(404).json({ success: false, message: "Withdrawal request not found" });
    }
    if (reqObj.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request is already ${reqObj.status}` });
    }

    const adminName = req.user?.name || req.user?.email || "ECD Admin";
    const reasonText = reason || adminNote || "Rejected by admin";

    // Revert pending amount for restaurant wallet if reserved
    if (reqObj.restaurant || reqObj.requestType === 'restaurant') {
      const restId = reqObj.restaurant || (await Restaurant.findOne({ owner: reqObj.user }))?._id;
      if (restId) {
        const restWallet = await RestaurantWallet.findOne({ restaurant: restId });
        if (restWallet) {
          restWallet.pendingAmount = Math.max(0, (restWallet.pendingAmount || 0) - reqObj.amount);
          await restWallet.save();
        }
      }
    }

    reqObj.status = "rejected";
    reqObj.rejectedBy = adminName;
    reqObj.adminNote = reasonText;
    reqObj.processedAt = new Date();
    await reqObj.save();

    // Send push notification & socket event
    try {
      const targetUserId = reqObj.user?._id || reqObj.user;
      if (targetUserId) {
        const notifTitle = `Payout Request Rejected ⚠️`;
        const notifBody = `Your payout request of ₹${reqObj.amount} was rejected by ${adminName}. Reason: ${reasonText}`;
        
        await sendNotification(
          targetUserId,
          notifTitle,
          notifBody,
          {
            type: reqObj.requestType === 'restaurant' ? "RESTAURANT_PAYOUT_REJECTED" : "PAYOUT_REJECTED",
            withdrawalId: reqObj._id.toString(),
            amount: reqObj.amount.toString(),
            status: "rejected",
            rejectedBy: adminName,
            reason: reasonText,
            processedAt: reqObj.processedAt.toISOString()
          }
        );
      }
    } catch (notifErr) {
      console.error("Failed to send payout rejection notification:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Withdrawal request rejected",
      request: reqObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


