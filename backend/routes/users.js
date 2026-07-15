const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users (customers, admins)
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const query = {};
  
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
    
  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: users,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page: Number(page)
    }
  });
}));

module.exports = router;
