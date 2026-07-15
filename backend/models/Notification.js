const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // null means broadcast or admin-only
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'system', 'inventory', 'message'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  targetRole: {
    type: String,
    enum: ['all', 'admin', 'customer'],
    default: 'all'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
