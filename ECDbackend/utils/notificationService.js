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
    let inferredApp = data?.targetApp || 'all';

    // Try finding direct User
    targetUser = await User.findById(userIdStr).select("fcmToken fcmTokens name role");
    if (targetUser) {
      if (data?.targetApp && targetUser.fcmTokens?.[data.targetApp]) {
        targetFcmToken = targetUser.fcmTokens[data.targetApp];
      } else {
        targetFcmToken = targetUser.fcmToken;
      }
      recipientName = targetUser.name || "User";
    } else {
      // Try finding Rider if userIdStr was a Rider ID
      const rider = await Rider.findById(userIdStr).populate("user", "fcmToken fcmTokens name role");
      if (rider) {
        inferredApp = 'rider';
        targetFcmToken = rider.user?.fcmTokens?.rider || rider.fcmToken || rider.user?.fcmToken;
        recipientName = rider.name || rider.user?.name || "Rider";
        if (rider.user) targetUser = rider.user;
      } else {
        // Try finding Restaurant if userIdStr was a Restaurant ID
        const restaurant = await Restaurant.findById(userIdStr).populate("owner", "fcmToken fcmTokens name role");
        if (restaurant) {
          inferredApp = 'restaurant';
          targetFcmToken = restaurant.owner?.fcmTokens?.restaurant || restaurant.fcmToken || restaurant.owner?.fcmToken;
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
        targetApp: ['customer', 'restaurant', 'rider', 'all'].includes(inferredApp) ? inferredApp : 'all',
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
      socketService.emitToUser(userIdStr, "notification", notifData);
      socketService.emitToUser(userIdStr, "newNotification", notifData);
      socketService.emitToCustomer(userIdStr, "notification:new", notifData);
      socketService.emitToCustomer(userIdStr, "notification", notifData);
      if (recipientUserId !== userIdStr) {
        socketService.emitToUser(recipientUserId, "notification:new", notifData);
        socketService.emitToUser(recipientUserId, "notification", notifData);
        socketService.emitToCustomer(recipientUserId, "notification:new", notifData);
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

function interpolateTemplate(templateStr, placeholders = {}) {
  if (!templateStr || typeof templateStr !== "string") return "";
  return templateStr.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const val = placeholders[key];
    return val !== undefined && val !== null ? String(val) : "";
  });
}

exports.sendTemplatedNotification = async ({
  userId,
  templateKey,
  placeholders = {},
  data = {},
  fallbackTitle = "",
  fallbackMessage = "",
}) => {
  try {
    let title = fallbackTitle;
    let message = fallbackMessage;
    try {
      const AdminSetting = require("../models/AdminSetting");
      const settings = await AdminSetting.getSettings();
      const tpl = settings?.notificationTemplates?.[templateKey];
      if (tpl && tpl.enabled !== false) {
        if (tpl.title) title = interpolateTemplate(tpl.title, placeholders) || fallbackTitle;
        if (tpl.body) message = interpolateTemplate(tpl.body, placeholders) || fallbackMessage;
      }
    } catch (_) {
      // Safe fallback to caller-supplied defaults
    }
    return exports.sendNotification(userId, title, message, data);
  } catch (error) {
    console.error("❌ sendTemplatedNotification Error:", error.message);
    return exports.sendNotification(userId, fallbackTitle, fallbackMessage, data);
  }
};
