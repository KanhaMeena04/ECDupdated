const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['Admin', 'Restaurant Admin', 'Rider Manager', 'Support'],
    default: 'Admin'
  },
  description: {
    type: String,
    default: ''
  },
  permissions: [{
    type: String
  }],
  isSystemDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
