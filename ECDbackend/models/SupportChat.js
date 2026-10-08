const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin', 'system'],
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  senderName: {
    type: String,
    default: 'User',
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

const supportChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    guestId: {
      type: String,
      default: null,
      index: true,
    },
    userName: {
      type: String,
      default: 'Customer',
    },
    userPhone: {
      type: String,
      default: '',
    },
    userEmail: {
      type: String,
      default: '',
    },
    userType: {
      type: String,
      enum: ['customer', 'rider', 'restaurant_owner', 'user'],
      default: 'customer',
    },
    orderId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'closed'],
      default: 'active',
      index: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCountAdmin: {
      type: Number,
      default: 0,
    },
    unreadCountUser: {
      type: Number,
      default: 0,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportChat', supportChatSchema);
