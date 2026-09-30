const { admin, isInitialized } = require("../config/firebaseConfig");
const User = require("../models/User");
const Rider = require("../models/Rider");
const Restaurant = require("../models/Restaurant");
const Notification = require("../models/Notification");
const socketService = require("../services/socketService");
const { logger } = require("./logger");

exports.sendNotification = async (userId, title, message, data = {}) => {
  try {
    if (!userId) {
      console.warn("⚠️ sendNotification: userId is required (undefined/null provided)");
      return false;
    }
    const userIdStr = userId.toString ? userId.toString() : String(userId);

    // 1. Resolve Target User and FCM Token across User, Rider, and Restaurant models
    let targetUser = null;
    let targetFcmToken = null;
    let recipientName = "User";

    // Try finding direct User
    targetUser = await User.findById(userIdStr).select("fcmToken name role");
    if (targetUser) {
      targetFcmToken = targetUser.fcmToken;
      recipientName = targetUser.name || "User";
    } else {
      // Try finding Rider if userIdStr was a Rider ID
      const rider = await Rider.findById(userIdStr).populate("user", "fcmToken name role");
      if (rider) {
        targetFcmToken = rider.user?.fcmToken || rider.fcmToken;
        recipientName = rider.name || rider.user?.name || "Rider";
        if (rider.user) targetUser = rider.user;
      } else {
        // Try finding Restaurant if userIdStr was a Restaurant ID
        const restaurant = await Restaurant.findById(userIdStr).populate("owner", "fcmToken name role");
        if (restaurant) {
          targetFcmToken = restaurant.owner?.fcmToken || restaurant.fcmToken;
          recipientName = restaurant.name || restaurant.owner?.name || "Restaurant";
          if (restaurant.owner) targetUser = restaurant.owner;
        }
      }
    }

    const recipientUserId = targetUser?._id ? targetUser._id.toString() : userIdStr;

    // 2. Persist notification to MongoDB Database
    let savedDoc = null;
    try {
      const allowedTypes = ['order_status', 'promo_offer', 'system', 'general', 'dispatch_request', 'order_available'];
      let type = data?.type || (title.toLowerCase().includes('offer') || title.toLowerCase().includes('discount') ? 'promo_offer' : 'order_status');
      if (!allowedTypes.includes(type)) {
        type = 'order_status';
      }
      savedDoc = await Notification.create({
        user: recipientUserId,
        title,
        message,
        type,
        data: data || {},
      });
    } catch (dbErr) {
      console.error("❌ Failed to save notification to DB:", dbErr.message);
    }

    // 3. Emit real-time WebSocket events
    try {
      const notifData = {
        _id: savedDoc?._id || new Date().getTime().toString(),
        title,
        message,
        data: data || {},
        isRead: false,
        createdAt: savedDoc?.createdAt || new Date(),
        timestamp: new Date(),
      };
      socketService.emitToUser(userIdStr, "notification:new", notifData);
      if (recipientUserId !== userIdStr) {
        socketService.emitToUser(recipientUserId, "notification:new", notifData);
      }
      console.log(`🔌 Socket notification sent to target ${userIdStr} / ${recipientUserId}`);
    } catch (socketError) {
      console.error(`❌ Failed to send socket notification to ${userIdStr}:`, socketError.message);
    }

    // 4. Send FCM Push Notification (works for Background and Closed Apps)
    if (isInitialized && admin) {
      try {
        if (targetFcmToken && typeof targetFcmToken === 'string' && targetFcmToken.trim().length > 0) {
          // Format payload with explicit high priority android & apns fields for background/closed app display
          const payload = {
            notification: {
              title: title,
              body: message,
            },
            data: {
              ...Object.fromEntries(
                Object.entries(data || {}).map(([k, v]) => [k, String(v)])
              ),
              title: String(title),
              body: String(message),
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
            android: {
              priority: "high",
              notification: {
                title: title,
                body: message,
                channelId: "high_importance_channel",
                sound: "default",
                priority: "high",
                defaultSound: true,
                defaultVibrateTimings: true,
                visibility: "public"
              }
            },
            apns: {
              payload: {
                aps: {
                  alert: {
                    title: title,
                    body: message,
                  },
                  sound: "default",
                  badge: 1,
                  contentAvailable: true,
                }
              }
            },
            token: targetFcmToken,
          };

          try {
            await Promise.race([
              admin.messaging().send(payload),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('FCM send timeout')), 5000)
              )
            ]);
            console.log(`📲 FCM push notification sent to ${recipientName} (${recipientUserId})`);
          } catch (fcmTimeoutError) {
            if (fcmTimeoutError.message.includes('timeout')) {
              console.warn(`⚠️ FCM timeout for user ${recipientUserId}, continuing...`);
            } else {
              throw fcmTimeoutError;
            }
          }
        } else {
          console.log(`ℹ️ No FCM token found for target ${userIdStr} (${recipientName}), skipping push.`);
        }
      } catch (fcmError) {
        if (
          fcmError.code === "messaging/registration-token-not-registered" ||
          fcmError.code === "messaging/invalid-argument"
        ) {
          console.warn(`⚠️ Invalid FCM token for target ${recipientUserId}. Removing from DB.`);
          await User.findByIdAndUpdate(recipientUserId, { $unset: { fcmToken: 1 } }).catch(e => console.error("Cleanup error:", e));
        } else {
          console.error(`❌ FCM Error for target ${recipientUserId}:`, fcmError.message);
        }
      }
    } else {
      if (!isInitialized) {
        console.warn("ℹ️ Firebase not initialized, FCM push notifications disabled");
      }
    }
    return true;
  } catch (error) {
    console.error("❌ sendNotification Service Error:", error);
    return false;
  }
};
