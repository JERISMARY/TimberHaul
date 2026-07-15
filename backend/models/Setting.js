const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  storeName: { type: String, default: 'TimberHaul' },
  contactEmail: { type: String, default: 'support@timberhaul.com' },
  contactPhone: { type: String, default: '+1 234 567 8900' },
  currency: { type: String, default: 'INR' },
  taxRate: { type: Number, default: 18 },
  shippingFlatRate: { type: Number, default: 500 },
  freeShippingThreshold: { type: Number, default: 10000 },
  smtp: {
    host: String,
    port: Number,
    user: String,
    pass: String
  },
  cloudinary: {
    cloudName: String,
    apiKey: String,
    apiSecret: String
  },
  theme: {
    primaryColor: { type: String, default: '#8B5E3C' },
    fontFamily: { type: String, default: 'Inter, sans-serif' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
