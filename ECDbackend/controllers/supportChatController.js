const SupportChat = require('../models/SupportChat');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Rider = require('../models/Rider');
const socketService = require('../services/socketService');
const notificationService = require('../utils/notificationService');

const getCleanName = (val, fallback = '') => {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.en || val.hi || val.name || Object.values(val)[0] || fallback;
  return String(val);
};

/**
 * GET /api/support/chat/messages
 * Get or initialize current user's support chat (supports logged-in user or guest)
 */
exports.getUserChatMessages = async (req, res) => {
  try {
    const userId = req.user?._id;
    const guestId = req.headers['x-guest-id'] || req.query.guestId;

    if (!userId && !guestId) {
      return res.status(400).json({ success: false, message: 'User or Guest identification required' });
    }

    let chat = null;
    if (userId) {
      chat = await SupportChat.findOne({ user: userId });
      // If user logged in now, but had a previous guest chat with this guestId, link it
      if (!chat && guestId) {
        chat = await SupportChat.findOne({ guestId: guestId });
        if (chat) {
          chat.user = userId;
          await chat.save();
        }
      }
    } else if (guestId) {
      chat = await SupportChat.findOne({ guestId: guestId });
    }

    if (!chat) {
      const u = userId ? await User.findById(userId).lean() : null;
      let userName = (u && u.name) ? u.name : (req.query.userName || 'Customer');
      let userType = (u && u.role) ? u.role : 'customer';
      if (userId && (u?.role === 'restaurant_owner' || u?.role === 'restaurant')) {
        const rest = await Restaurant.findOne({ owner: userId }).select('name').lean();
        if (rest && rest.name) {
          const rName = getCleanName(rest.name);
          userName = `${rName} (Restaurant)`;
          userType = 'restaurant_owner';
        }
      } else if (userId && (u?.role === 'rider' || u?.role === 'driver')) {
        const rider = await Rider.findOne({ user: userId }).select('name').lean();
        if (rider && rider.name) {
          userName = `${rider.name} (Rider)`;
          userType = 'rider';
        }
      }
      const userPhone = (u && (u.mobile || u.phone)) ? (u.mobile || u.phone) : (req.query.userPhone || '');
      const userEmail = (u && u.email) ? u.email : '';

      chat = await SupportChat.create({
        user: userId || null,
        guestId: (!userId && guestId) ? String(guestId) : null,
        userName,
        userPhone,
        userEmail,
        userType,
        status: 'active',
        lastMessage: 'Thanks for contacting ECDKart Support! Our agent will assist you shortly.',
        lastMessageAt: new Date(),
        unreadCountAdmin: 0,
        unreadCountUser: 0,
        messages: [
          {
            sender: 'system',
            senderName: 'ECDKart Support',
            message: 'Thanks for contacting ECDKart Support! Our agent will assist you shortly.',
            createdAt: new Date(),
            read: true,
          },
        ],
      });
    } else {
      // Mark admin messages as read by user
      let updated = false;
      chat.messages.forEach((m) => {
        if (m.sender === 'admin' && !m.read) {
          m.read = true;
          updated = true;
        }
      });
      if (chat.unreadCountUser > 0 || updated) {
        chat.unreadCountUser = 0;
        await chat.save();
      }
    }

    return res.status(200).json({
      success: true,
      conversation: chat,
      messages: chat.messages,
    });
  } catch (error) {
    console.error('getUserChatMessages error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/support/chat/send
 * User sends a message to Support
 */
exports.sendUserChatMessage = async (req, res) => {
  try {
    const userId = req.user?._id;
    const guestId = req.headers['x-guest-id'] || req.body.guestId;
    const { message, orderId, userName, userPhone } = req.body;

    if (!userId && !guestId) {
      return res.status(400).json({ success: false, message: 'User or Guest identification required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const trimmedMsg = message.trim();
    let chat = null;

    if (userId) {
      chat = await SupportChat.findOne({ user: userId });
      if (!chat && guestId) {
        chat = await SupportChat.findOne({ guestId: guestId });
        if (chat) chat.user = userId;
      }
    } else if (guestId) {
      chat = await SupportChat.findOne({ guestId: guestId });
    }

    if (!chat) {
      const u = userId ? await User.findById(userId).lean() : null;
      chat = new SupportChat({
        user: userId || null,
        guestId: (!userId && guestId) ? String(guestId) : null,
        userName: u?.name || userName || 'Customer',
        userPhone: u?.mobile || u?.phone || userPhone || '',
        userEmail: u?.email || '',
        userType: u?.role || 'customer',
        orderId: orderId || null,
        messages: [],
      });
    }

    if (orderId && !chat.orderId) {
      chat.orderId = orderId;
    }

    const senderDisplayName = chat.userName || userName || 'Customer';

    const newMessage = {
      sender: 'user',
      senderId: userId || null,
      senderName: senderDisplayName,
      message: trimmedMsg,
      createdAt: new Date(),
      read: false,
    };

    chat.messages.push(newMessage);
    chat.lastMessage = trimmedMsg;
    chat.lastMessageAt = new Date();
    chat.unreadCountAdmin = (chat.unreadCountAdmin || 0) + 1;
    chat.status = 'active';

    await chat.save();

    const savedMsg = chat.messages[chat.messages.length - 1];
    const eventPayload = {
      conversationId: chat._id,
      user: {
        _id: userId || null,
        guestId: chat.guestId,
        name: chat.userName,
        phone: chat.userPhone,
        email: chat.userEmail,
        role: chat.userType,
      },
      orderId: chat.orderId,
      message: savedMsg,
      lastMessage: trimmedMsg,
      lastMessageAt: chat.lastMessageAt,
      unreadCountAdmin: chat.unreadCountAdmin,
    };

    // 1. Real-time broadcast to Admin Dashboard
    socketService.emitToAdmin('support:new_message', eventPayload);
    socketService.emitToAdmin('notification:new', {
      title: `Support: ${chat.userName}`,
      message: trimmedMsg,
      type: 'support',
      data: { conversationId: chat._id.toString() },
      createdAt: new Date(),
    });

    // 2. Broadcast to Support Room if admin or client is listening
    try {
      const io = socketService.getIO();
      if (io) {
        io.to(`support:${chat._id}`).emit('support:message', {
          conversationId: chat._id,
          message: savedMsg,
        });
      }
    } catch (_) {}

    // 3. Trigger notification to all active admin users
    User.find({ role: 'admin' }).select('_id').then(admins => {
      admins.forEach(adm => {
        notificationService.sendNotification(
          adm._id,
          `💬 Support: ${chat.userName}`,
          trimmedMsg,
          { type: 'system', conversationId: chat._id.toString() }
        ).catch(err => console.error('Admin support notification error:', err.message));
      });
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: savedMsg,
      conversation: chat,
    });
  } catch (error) {
    console.error('sendUserChatMessage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/support/admin/conversations
 * Admin gets list of all support conversations
 */
exports.getAdminConversations = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { userName: { $regex: q, $options: 'i' } },
        { userPhone: { $regex: q, $options: 'i' } },
        { userEmail: { $regex: q, $options: 'i' } },
        { lastMessage: { $regex: q, $options: 'i' } },
        { orderId: { $regex: q, $options: 'i' } },
      ];
    }

    const conversations = await SupportChat.find(filter)
      .select('user userName userPhone userEmail userType orderId status lastMessage lastMessageAt unreadCountAdmin unreadCountUser updatedAt createdAt')
      .sort({ lastMessageAt: -1 })
      .lean();

    const totalUnread = await SupportChat.aggregate([
      { $match: { unreadCountAdmin: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$unreadCountAdmin' } } },
    ]);

    return res.status(200).json({
      success: true,
      count: conversations.length,
      totalUnread: totalUnread.length > 0 ? totalUnread[0].total : 0,
      conversations,
    });
  } catch (error) {
    console.error('getAdminConversations error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/support/admin/conversations/:id
 * Admin gets specific conversation details and marks unread as 0
 */
exports.getAdminConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await SupportChat.findById(id).populate('user', 'name mobile phone email role avatar');

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Support chat conversation not found' });
    }

    // Mark messages as read by admin
    let updated = false;
    chat.messages.forEach((m) => {
      if (m.sender === 'user' && !m.read) {
        m.read = true;
        updated = true;
      }
    });

    if (chat.unreadCountAdmin > 0 || updated) {
      chat.unreadCountAdmin = 0;
      await chat.save();
    }

    return res.status(200).json({
      success: true,
      conversation: chat,
    });
  } catch (error) {
    console.error('getAdminConversationById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/support/admin/conversations/:id/reply
 * Admin replies to a customer support conversation
 */
exports.sendAdminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    const trimmedReply = message.trim();
    const chat = await SupportChat.findById(id);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Support chat conversation not found' });
    }

    const adminName = req.user?.name ? `${req.user.name} (Support)` : 'ECDKart Support';

    const newReply = {
      sender: 'admin',
      senderId: req.user?._id,
      senderName: adminName,
      message: trimmedReply,
      createdAt: new Date(),
      read: false,
    };

    chat.messages.push(newReply);
    chat.lastMessage = trimmedReply;
    chat.lastMessageAt = new Date();
    chat.unreadCountUser = (chat.unreadCountUser || 0) + 1;

    await chat.save();

    const savedReply = chat.messages[chat.messages.length - 1];

    // Emit live WebSocket reply to the customer
    const userEventPayload = {
      conversationId: chat._id,
      message: savedReply,
      sender: 'admin',
      senderName: adminName,
      lastMessage: trimmedReply,
      lastMessageAt: chat.lastMessageAt,
    };

    const targetUserId = chat.user ? chat.user.toString() : '';
    if (targetUserId) {
      socketService.emitToUser(targetUserId, 'support:admin_reply', userEventPayload);
      socketService.emitToCustomer(targetUserId, 'support:admin_reply', userEventPayload);
      socketService.emitToRiderByUserId(targetUserId, 'support:admin_reply', userEventPayload);
      socketService.emitToRestaurant(targetUserId, 'support:admin_reply', userEventPayload);
      // Trigger in-app & FCM push notification for the customer / user
      notificationService.sendNotification(
        targetUserId,
        'ECDKart Support Reply',
        trimmedReply,
        { type: 'system', conversationId: chat._id.toString() }
      ).catch(err => console.error('Customer support notification error:', err.message));
    }
    if (chat.guestId) {
      socketService.emitToUser(chat.guestId, 'support:admin_reply', userEventPayload);
    }

    // Broadcast to support room
    try {
      const io = socketService.getIO();
      if (io) {
        io.to(`support:${chat._id}`).emit('support:admin_reply', userEventPayload);
        io.to(`support:${chat._id}`).emit('support:message', {
          conversationId: chat._id,
          message: savedReply,
        });
      }
    } catch (_) {}

    // Also notify other connected admins
    socketService.emitToAdmin('support:admin_replied', {
      conversationId: chat._id,
      message: savedReply,
    });

    return res.status(200).json({
      success: true,
      message: savedReply,
      conversation: chat,
    });
  } catch (error) {
    console.error('sendAdminReply error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/support/admin/conversations/:id/status
 * Mark conversation as resolved / active
 */
exports.updateConversationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const chat = await SupportChat.findById(id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    chat.status = status;
    const sysMsg = status === 'resolved' 
      ? 'This support ticket has been marked as resolved by ECDKart Support. Feel free to message again if you need further help!' 
      : `Support ticket status updated to ${status}.`;

    chat.messages.push({
      sender: 'system',
      senderName: 'ECDKart System',
      message: sysMsg,
      createdAt: new Date(),
      read: true,
    });

    chat.lastMessage = sysMsg;
    chat.lastMessageAt = new Date();
    await chat.save();

    // Real-time broadcast
    const targetUserId = chat.user ? chat.user.toString() : '';
    if (targetUserId) {
      socketService.emitToUser(targetUserId, 'support:status_changed', {
        conversationId: chat._id,
        status,
        message: sysMsg,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Conversation status updated to ${status}`,
      conversation: chat,
    });
  } catch (error) {
    console.error('updateConversationStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/support/admin/search-entities
 * Search all Users, Restaurants, and Riders across the system for initiating/linking chat
 */
exports.searchEntitiesForSupport = async (req, res) => {
  try {
    const q = (req.query.query || req.query.q || req.query.search || '').trim();
    if (!q || q.length < 1) {
      return res.status(200).json({ success: true, results: [] });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    // 1. Search Users (Customers, riders, etc.)
    const users = await User.find({
      $or: [
        { name: regex },
        { firstName: regex },
        { lastName: regex },
        { mobile: regex },
        { phone: regex },
        { email: regex },
      ],
    })
      .select('_id name firstName lastName mobile phone email role avatar')
      .limit(20)
      .lean();

    // 2. Search Restaurants
    const restaurants = await Restaurant.find({
      $or: [
        { name: regex },
        { 'name.en': regex },
        { ownerName: regex },
        { contactNumber: regex },
        { phone: regex },
        { email: regex },
      ],
    })
      .select('_id name owner ownerName contactNumber phone email logo avatar profilePic')
      .limit(20)
      .lean();

    // 3. Search Riders
    const riders = await Rider.find({
      $or: [
        { name: regex },
        { mobile: regex },
        { phone: regex },
        { email: regex },
      ],
    })
      .select('_id name user mobile phone email profilePic avatar vehicle')
      .limit(20)
      .lean();

    // Collect all candidate user IDs to cross-reference with existing SupportChats
    const candidateUserIds = [];
    users.forEach((u) => candidateUserIds.push(u._id));
    riders.forEach((r) => { if (r.user) candidateUserIds.push(r.user); });
    restaurants.forEach((rest) => { if (rest.owner) candidateUserIds.push(rest.owner); });

    const existingChats = await SupportChat.find({
      $or: [
        { user: { $in: candidateUserIds } },
        { userName: regex },
        { userPhone: regex },
      ],
    })
      .select('_id user userName userPhone status lastMessage lastMessageAt unreadCountAdmin')
      .lean();

    const chatMapByUser = new Map();
    const chatMapByPhone = new Map();
    existingChats.forEach((chat) => {
      if (chat.user) chatMapByUser.set(String(chat.user), chat);
      if (chat.userPhone) chatMapByPhone.set(chat.userPhone, chat);
    });

    const results = [];

    // Format Restaurants
    restaurants.forEach((rest) => {
      const restName = getCleanName(rest.name, 'Restaurant');
      const ownerUserId = rest.owner ? String(rest.owner) : null;
      const phone = rest.contactNumber || rest.phone || '';
      const existingChat = (ownerUserId && chatMapByUser.get(ownerUserId)) || (phone && chatMapByPhone.get(phone));

      results.push({
        id: rest._id,
        entityType: 'restaurant',
        displayType: 'Restaurant',
        name: restName,
        subtext: rest.ownerName ? `Owner: ${rest.ownerName}` : 'Restaurant Partner',
        phone,
        email: rest.email || '',
        userId: ownerUserId,
        conversationId: existingChat ? existingChat._id : null,
        hasExistingChat: Boolean(existingChat),
        status: existingChat ? existingChat.status : null,
        lastMessage: existingChat ? existingChat.lastMessage : '',
      });
    });

    // Format Riders
    riders.forEach((rider) => {
      const riderUserId = rider.user ? String(rider.user) : null;
      const phone = rider.mobile || rider.phone || '';
      const existingChat = (riderUserId && chatMapByUser.get(riderUserId)) || (phone && chatMapByPhone.get(phone));

      results.push({
        id: rider._id,
        entityType: 'rider',
        displayType: 'Rider',
        name: rider.name || 'Delivery Partner',
        subtext: rider.vehicle?.plateNumber ? `Vehicle: ${rider.vehicle.plateNumber}` : 'Delivery Partner',
        phone,
        email: rider.email || '',
        userId: riderUserId,
        conversationId: existingChat ? existingChat._id : null,
        hasExistingChat: Boolean(existingChat),
        status: existingChat ? existingChat.status : null,
        lastMessage: existingChat ? existingChat.lastMessage : '',
      });
    });

    // Format Users / Customers
    users.forEach((u) => {
      if (u.role === 'admin') return; // Don't list admins
      const uid = String(u._id);
      const phone = u.mobile || u.phone || '';
      const existingChat = chatMapByUser.get(uid) || (phone && chatMapByPhone.get(phone));
      const roleDisplay = u.role === 'rider' ? 'Rider' : (u.role === 'restaurant_owner' ? 'Restaurant Owner' : 'Customer');

      results.push({
        id: u._id,
        entityType: u.role === 'rider' ? 'rider' : (u.role === 'restaurant_owner' ? 'restaurant' : 'customer'),
        displayType: roleDisplay,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Customer',
        subtext: u.email || 'Registered User',
        phone,
        email: u.email || '',
        userId: uid,
        conversationId: existingChat ? existingChat._id : null,
        hasExistingChat: Boolean(existingChat),
        status: existingChat ? existingChat.status : null,
        lastMessage: existingChat ? existingChat.lastMessage : '',
      });
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('searchEntitiesForSupport error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/support/admin/conversations/initiate
 * Admin initiates or opens a support conversation with a User, Restaurant, or Rider
 */
exports.initiateSupportConversation = async (req, res) => {
  try {
    const { entityType, entityId, userId, name, phone, email } = req.body;

    let chat = null;
    if (userId) {
      chat = await SupportChat.findOne({ user: userId });
    }
    if (!chat && phone) {
      chat = await SupportChat.findOne({ userPhone: phone });
    }

    if (chat) {
      if (chat.status === 'resolved' || chat.status === 'closed') {
        chat.status = 'active';
        await chat.save();
      }
      return res.status(200).json({
        success: true,
        conversation: chat,
        isNew: false,
      });
    }

    // Determine mapped user type
    let mappedType = 'customer';
    if (entityType === 'restaurant') mappedType = 'restaurant_owner';
    else if (entityType === 'rider') mappedType = 'rider';
    else mappedType = 'customer';

    const displayName = name || (mappedType === 'restaurant_owner' ? 'Restaurant Partner' : (mappedType === 'rider' ? 'Delivery Partner' : 'Customer'));

    chat = await SupportChat.create({
      user: userId || null,
      userName: displayName,
      userPhone: phone || '',
      userEmail: email || '',
      userType: mappedType,
      status: 'active',
      lastMessage: `Support channel opened with ${displayName}`,
      lastMessageAt: new Date(),
      unreadCountAdmin: 0,
      unreadCountUser: 0,
      messages: [
        {
          sender: 'system',
          senderName: 'ECDKart Support',
          message: `Live support session opened with ${displayName}. Type your message below to start chatting.`,
          createdAt: new Date(),
          read: true,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      conversation: chat,
      isNew: true,
    });
  } catch (error) {
    console.error('initiateSupportConversation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
