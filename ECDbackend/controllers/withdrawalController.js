const Withdrawal = require("../models/WithdrawalRequest");
const User = require("../models/User");
const Rider = require("../models/Rider");
const RiderWallet = require("../models/RiderWallet");
const { getPaginationParams } = require('../utils/pagination');

exports.getAllWithdrawals = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req, 50);
    const statusFilter = req.query.status;
    const query = {};
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }
    
    const total = await Withdrawal.countDocuments(query);
    const requests = await Withdrawal.find(query)
      .populate("user", "name mobile email walletBalance upi role")
      .populate("rider", "_id vehicle bankDetails upiId verificationStatus")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(requests.map(async (doc) => {
      let r = doc.rider;
      if (!r && doc.user) {
        r = await Rider.findOne({ user: doc.user._id || doc.user }).select('_id vehicle bankDetails upiId verificationStatus');
      }
      const w = r ? await RiderWallet.findOne({ rider: r._id }) : null;
      const obj = doc.toObject();
      obj.riderProfile = r || null;
      obj.walletBalance = w?.availableBalance ?? doc.user?.walletBalance ?? 0;
      obj.cashInHand = w?.cashInHand ?? 0;
      obj.totalEarnings = w?.totalEarnings ?? 0;
      obj.riderId = r ? (r.riderId || r._id) : (doc.user?._id || 'N/A');

      // Ensure bankDetails are fully populated
      const rBank = r?.bankDetails || {};
      obj.bankDetails = {
        accountHolder: obj.bankDetails?.accountHolder || obj.bankDetails?.accountHolderName || rBank.accountHolder || rBank.accountHolderName || doc.user?.name || 'Rider',
        bankName: obj.bankDetails?.bankName || rBank.bankName || '',
        accountNumber: obj.bankDetails?.accountNumber || rBank.accountNumber || '',
        ifsc: obj.bankDetails?.ifsc || obj.bankDetails?.ifscCode || rBank.ifsc || rBank.ifscCode || '',
        upiId: obj.bankDetails?.upiId || obj.bankDetails?.upi || rBank.upiId || rBank.upi || doc.user?.upi || '',
        phone: obj.bankDetails?.phone || doc.user?.mobile || doc.user?.phone || ''
      };

      return obj;
    }));

    return res.status(200).json({
      success: true,
      withdrawals: enriched,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const { sendNotification } = require("../utils/notificationService");

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

    // Deduct from wallet if available
    const user = await User.findById(reqObj.user);
    if (user && user.walletBalance >= reqObj.amount) {
      user.walletBalance -= reqObj.amount;
      await user.save();
    }

    if (reqObj.rider) {
      const wallet = await RiderWallet.findOne({ rider: reqObj.rider });
      if (wallet && wallet.availableBalance >= reqObj.amount) {
        wallet.availableBalance -= reqObj.amount;
        wallet.totalPayouts = (wallet.totalPayouts || 0) + reqObj.amount;
        wallet.lastPayoutAt = new Date();
        wallet.lastPayoutAmount = reqObj.amount;
        await wallet.save();
      }
    }

    const adminName = req.user?.name || req.user?.email || "ECD Admin";
    const selectedPaidVia = paidVia || reqObj.method || "upi";
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

    let notifTitle = `Payment Successful! 💰`;
    let notifBody = "";

    if (selectedPaidVia === "upi") {
      notifBody = `₹${reqObj.amount} has been successfully sent to your UPI ID (${upiId}).${utrNumber ? ` Ref/UTR: ${utrNumber}.` : ''} Paid by ${adminName}.`;
    } else if (selectedPaidVia === "bank") {
      notifBody = `₹${reqObj.amount} has been successfully transferred to your ${bankName} A/C ending in ${accLast4 || '****'}${ifsc ? ` (IFSC: ${ifsc})` : ''}.${utrNumber ? ` Ref/UTR: ${utrNumber}.` : ''} Paid by ${adminName}.`;
    } else {
      notifBody = `Your payout request of ₹${reqObj.amount} has been approved and paid by ${adminName}.${utrNumber ? ` Ref/UTR: ${utrNumber}.` : ''}`;
    }

    // Send push notification & socket event to Rider
    try {
      const targetUserId = reqObj.user?._id || reqObj.user;
      if (targetUserId) {
        await sendNotification(
          targetUserId,
          notifTitle,
          notifBody,
          {
            type: "PAYOUT_APPROVED",
            withdrawalId: reqObj._id.toString(),
            amount: reqObj.amount.toString(),
            status: "approved",
            paidVia: selectedPaidVia,
            upiId: upiId,
            accountNumber: accNum,
            ifsc: ifsc,
            bankName: bankName,
            paidBy: adminName,
            approvedBy: adminName,
            utrNumber: utrNumber || reqObj.utrNumber || "",
            adminNote: reqObj.adminNote || "",
            processedAt: reqObj.processedAt.toISOString()
          }
        );
        console.log(`✅ Payout approval notification sent to rider ${targetUserId} by ${adminName}: ${notifBody}`);
      }
    } catch (notifErr) {
      console.error("Failed to send payout notification:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Withdrawal request approved successfully",
      request: reqObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
    reqObj.status = "rejected";
    reqObj.rejectedBy = adminName;
    reqObj.adminNote = reasonText;
    reqObj.processedAt = new Date();
    await reqObj.save();

    // Send push notification & socket event to Rider
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
            type: "PAYOUT_REJECTED",
            withdrawalId: reqObj._id.toString(),
            amount: reqObj.amount.toString(),
            status: "rejected",
            rejectedBy: adminName,
            reason: reasonText,
            processedAt: reqObj.processedAt.toISOString()
          }
        );
        console.log(`⚠️ Payout rejection notification sent to rider ${targetUserId} by ${adminName}`);
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


