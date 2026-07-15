const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Supplier = require('../models/Supplier');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ isActive: true }).sort('name').lean();
  res.json({ success: true, suppliers });
}));

router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, supplier });
}));

router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, supplier });
}));

module.exports = router;
