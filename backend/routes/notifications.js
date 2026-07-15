const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET /api/notifications
// @desc    Get user/admin notifications
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  let query = { user: req.user._id };
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    query = { $or: [{ user: req.user._id }, { targetRole: 'admin' }, { targetRole: 'all' }] };
  } else {
    query = { $or: [{ user: req.user._id }, { targetRole: 'customer' }, { targetRole: 'all' }] };
  }

  const notifications = await Notification.find(query).sort('-createdAt').limit(50);
  res.json({ success: true, data: notifications });
}));

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) { res.status(404); throw new Error('Not found'); }
  
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: notification });
}));

// @route   POST /api/notifications
// @desc    Create a notification (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const notification = await Notification.create(req.body);
  res.status(201).json({ success: true, data: notification });
}));

module.exports = router;
