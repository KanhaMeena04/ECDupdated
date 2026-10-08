const express = require('express');
const router = express.Router();
const { protect, optionalAuth, admin } = require('../middleware/authMiddleware');
const {
  getUserChatMessages,
  sendUserChatMessage,
  getAdminConversations,
  getAdminConversationById,
  sendAdminReply,
  updateConversationStatus,
} = require('../controllers/supportChatController');

// User chat endpoints (supports authenticated users & guests)
router.get('/chat/messages', optionalAuth, getUserChatMessages);
router.post('/chat/send', optionalAuth, sendUserChatMessage);
router.get('/messages', optionalAuth, getUserChatMessages);
router.post('/send', optionalAuth, sendUserChatMessage);

// Admin chat management endpoints
router.get('/admin/conversations', protect, admin, getAdminConversations);
router.get('/admin/conversations/:id', protect, admin, getAdminConversationById);
router.post('/admin/conversations/:id/reply', protect, admin, sendAdminReply);
router.patch('/admin/conversations/:id/status', protect, admin, updateConversationStatus);

// Aliases for convenience
router.get('/conversations', protect, admin, getAdminConversations);
router.get('/conversations/:id', protect, admin, getAdminConversationById);
router.post('/conversations/:id/reply', protect, admin, sendAdminReply);
router.patch('/conversations/:id/status', protect, admin, updateConversationStatus);

module.exports = router;
