const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true // e.g., 'UPDATE_ORDER', 'DELETE_PRODUCT'
  },
  entityType: {
    type: String,
    required: true // e.g., 'Order', 'Product'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
