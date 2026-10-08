const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const AdminSetting = require('../models/AdminSetting');
const socketService = require('./socketService');
const { sendNotification } = require('../utils/notificationService');

/**
 * Calculates reward points for an order amount
 */
function calculateOrderReward(amount, rewardPercentage = 5, maxReward = 200) {
  const numAmount = Number(amount) || 0;
  if (numAmount <= 0) return 5;
  const calculated = Math.round((numAmount * rewardPercentage) / 100);
  const points = Math.max(5, calculated); // Minimum 5 points for every completed order
  return maxReward > 0 ? Math.min(points, maxReward) : points;
}

/**
 * Credits customer reward points & wallet cashback upon order completion
 * @param {string|mongoose.Types.ObjectId|object} orderOrId - Order document or Order ID
 * @returns {Promise<{success: boolean, points: number, cashback: number, walletBalance: number}|null>}
 */
async function creditOrderRewards(orderOrId) {
  try {
    let order = null;
    if (orderOrId && typeof orderOrId === 'object' && orderOrId._id) {
      order = orderOrId;
    } else if (orderOrId) {
      const targetId = String(orderOrId).trim();
      const isObjectId = mongoose.Types.ObjectId.isValid(targetId) && targetId.length === 24;
      const filter = isObjectId
        ? { $or: [{ _id: targetId }, { orderId: targetId }, { orderNumber: targetId }] }
        : { $or: [{ orderId: targetId }, { orderNumber: targetId }] };
      order = await Order.findOne(filter);
    }

    if (!order) {
      console.warn('[RewardService] Order not found for reward crediting:', orderOrId);
      return null;
    }

    // Guard against duplicate reward crediting
    if (order.rewardPointsCredited) {
      console.log(`[RewardService] Order ${order.orderNumber || order._id} rewards already credited.`);
      return { alreadyCredited: true, points: order.rewardPoints || 0 };
    }

    const customerId = order.customer?._id || order.customer;
    if (!customerId) {
      console.warn(`[RewardService] No customer found on Order ${order._id}`);
      return null;
    }

    const user = await User.findById(customerId);
    if (!user) {
      console.warn(`[RewardService] Customer user not found: ${customerId}`);
      return null;
    }

    // Retrieve platform configuration
    let rewardPct = 5;
    let maxReward = 200;
    let creditToWallet = true;

    try {
      const settings = await AdminSetting.findOne({});
      if (settings?.rewardConfig) {
        if (settings.rewardConfig.enabled === false) {
          console.log('[RewardService] Rewards disabled in AdminSetting.');
          return null;
        }
        rewardPct = settings.rewardConfig.rewardPercentage || 5;
        maxReward = settings.rewardConfig.maxRewardPerOrder || 200;
        creditToWallet = settings.rewardConfig.creditToWallet !== false;
      }
    } catch (_) {}

    const orderAmount = order.payableAmount || order.totalAmount || order.itemTotal || 0;
    const points = calculateOrderReward(orderAmount, rewardPct, maxReward);
    const cashback = creditToWallet ? points : 0;

    // Credit User Account
    user.rewardPoints = (user.rewardPoints || 0) + points;
    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    if (cashback > 0) {
      user.walletBalance = Number(((user.walletBalance || 0) + cashback).toFixed(2));
    }
    user.totalOrders = (user.totalOrders || 0) + 1;
    user.totalAmountSpent = Number(((user.totalAmountSpent || 0) + orderAmount).toFixed(2));
    await user.save();

    // Create Audit Ledger in WalletTransaction
    if (cashback > 0) {
      try {
        await WalletTransaction.create({
          user: user._id,
          amount: cashback,
          type: 'credit',
          description: `Reward Cashback for Order #${order.orderNumber || order.orderId || order._id}`,
          orderId: order._id,
        });
      } catch (txnErr) {
        console.error('[RewardService] WalletTransaction ledger error:', txnErr.message);
      }
    }

    // Mark Order as credited
    order.rewardPointsCredited = true;
    order.rewardPoints = points;
    order.rewardAmount = cashback;
    await order.save();

    console.log(`✅ [RewardService] Credited ${points} points / ₹${cashback} to ${user.name} (${user.mobile || user.phone}) for Order #${order.orderNumber || order._id}`);

    // Real-time WebSockets to User
    try {
      socketService.emitToCustomer(user._id.toString(), 'wallet:updated', {
        walletBalance: user.walletBalance,
        rewardPoints: user.rewardPoints,
        orderId: order._id.toString(),
      });
      socketService.emitToCustomer(user._id.toString(), 'order:reward', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || order.orderId,
        points,
        cashback,
        walletBalance: user.walletBalance,
      });
    } catch (sockErr) {
      console.warn('[RewardService] Socket emit error:', sockErr.message);
    }

    // Push Notification to User
    try {
      await sendNotification(
        user._id,
        '🎉 Rewards Credited!',
        `You earned ${points} Reward Points (₹${cashback} cashback credited to your Wallet) for Order #${order.orderNumber || order._id}! Thank you for choosing ECDkart.`,
        {
          orderId: order._id.toString(),
          type: 'reward_credited',
          points: String(points),
          cashback: String(cashback),
          walletBalance: String(user.walletBalance)
        }
      );
    } catch (notifErr) {
      console.warn('[RewardService] Push notification error:', notifErr.message);
    }

    return {
      success: true,
      points,
      cashback,
      walletBalance: user.walletBalance,
      rewardPoints: user.rewardPoints
    };
  } catch (error) {
    console.error('[RewardService] Error crediting order rewards:', error);
    return null;
  }
}

module.exports = {
  calculateOrderReward,
  creditOrderRewards,
};
