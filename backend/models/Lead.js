const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  source: { type: String, enum: ['Website', 'Dealer Portal', 'Referral', 'Other'], default: 'Website' },
  status: { type: String, enum: ['New', 'Contacted', 'Quoted', 'Converted', 'Lost'], default: 'New' },
  salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: [{
    text: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  followUpDate: { type: Date },
  estimatedValue: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', LeadSchema);
