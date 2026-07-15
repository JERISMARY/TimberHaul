const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

// @route   GET /api/activity-logs
// @desc    Get system activity logs
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const logs = await ActivityLog.find()
    .populate('admin', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
    
  const total = await ActivityLog.countDocuments();

  res.json({ 
    success: true, 
    data: logs,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page: Number(page)
    }
  });
}));

// @route   POST /api/activity-logs
// @desc    Log an activity
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const log = await ActivityLog.create({
    ...req.body,
    admin: req.user._id,
    ipAddress: req.ip
  });
  res.status(201).json({ success: true, data: log });
}));

module.exports = router;
