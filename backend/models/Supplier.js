const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  company: String,
  address: {
    street: String, city: String, state: String, country: String, pincode: String
  },
  woodTypes: [String],
  certifications: [String], // FSC, PEFC, etc.
  rating: { type: Number, default: 0, min: 0, max: 5 },
  isActive: { type: Boolean, default: true },
  paymentTerms: String,
  leadTime: Number, // days
  minimumOrder: Number,
  website: String,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
