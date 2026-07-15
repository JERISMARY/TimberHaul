const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: String,
  message: { type: String, required: true },
  type: { type: String, enum: ['contact', 'support', 'bulk_inquiry', 'chat'], default: 'contact' },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  replies: [{
    message: String,
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now }
  }],
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
