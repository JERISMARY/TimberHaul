const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/auth');

// @route POST /api/coupons - Create a new coupon (Admin)
router.post('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
}));

// @route GET /api/coupons - Get all coupons (Admin)
router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort('-createdAt');
  res.json({ success: true, coupons });
}));

// @route GET /api/coupons/validate - Validate coupon (Public)
router.get('/validate', asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.query;
  if (!code) { res.status(400); throw new Error('Please provide a coupon code'); }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) { res.status(404); throw new Error('Invalid coupon code'); }

  const validation = coupon.isValid(Number(orderTotal || 0));
  if (!validation.valid) {
    res.status(400); throw new Error(validation.message);
  }

  const discountAmount = coupon.calculateDiscount(Number(orderTotal || 0));
  res.json({ success: true, discountAmount, couponId: coupon._id, code: coupon.code });
}));

// @route DELETE /api/coupons/:id - Delete a coupon (Admin)
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }
  res.json({ success: true, message: 'Coupon deleted' });
}));

module.exports = router;
