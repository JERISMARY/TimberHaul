const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: [true, 'Coupon code is required'], 
    unique: true, 
    trim: true, 
    uppercase: true 
  },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  minOrderAmount: { 
    type: Number, 
    default: 0 
  },
  maxDiscountAmount: { 
    type: Number, 
    default: null // Useful for percentage discounts with a cap
  },
  expirationDate: { 
    type: Date, 
    required: true 
  },
  usageLimit: { 
    type: Number, 
    default: null // Total number of times this coupon can be used
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Check if coupon is valid
CouponSchema.methods.isValid = function(orderTotal) {
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (this.expirationDate < Date.now()) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (this.minOrderAmount > 0 && orderTotal < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount of ₹${this.minOrderAmount} required` };
  }
  return { valid: true };
};

// Calculate discount amount
CouponSchema.methods.calculateDiscount = function(orderTotal) {
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderTotal * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
  }
  return Math.min(discount, orderTotal); // Discount cannot exceed total
};

module.exports = mongoose.model('Coupon', CouponSchema);
