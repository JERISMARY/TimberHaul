const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const Setting = require('../models/Setting');

// @route   GET /api/settings
// @desc    Get global settings
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  res.json({ success: true, data: settings });
}));

// @route   PUT /api/settings
// @desc    Update global settings
// @access  Private/Admin
router.put('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create(req.body);
  } else {
    settings = await Setting.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
  }
  res.json({ success: true, data: settings });
}));

module.exports = router;
