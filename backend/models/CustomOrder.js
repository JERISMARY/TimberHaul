const mongoose = require('mongoose');

const CustomOrderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Allow guests to request custom quotes if desired, but user is preferred
  },
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  furnitureType: { 
    type: String, 
    required: true // e.g. Dining Table, Bed, Cabinet
  },
  woodType: { 
    type: String, 
    required: true 
  },
  dimensions: {
    length: String,
    width: String,
    height: String,
    unit: { type: String, default: 'mm' }
  },
  finish: String, // e.g., Matte, Glossy, Natural
  color: String,
  upholstery: String, // If applicable
  quantity: { type: Number, default: 1 },
  referenceImages: [{
    url: String,
    publicId: String
  }],
  additionalRequirements: {
    type: String,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending_review', 'quoted', 'accepted', 'manufacturing', 'shipped', 'delivered', 'rejected'],
    default: 'pending_review'
  },
  quotedPrice: {
    type: Number,
    default: null
  },
  estimatedCompletionDays: {
    type: Number,
    default: null
  },
  adminNotes: String
}, { timestamps: true });

module.exports = mongoose.model('CustomOrder', CustomOrderSchema);
