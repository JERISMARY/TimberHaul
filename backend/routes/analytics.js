const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard metrics (revenue, orders, users)
// @access  Private/Admin
router.get('/dashboard', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const [totalOrders, totalUsers, totalProducts] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments()
  ]);

  const orders = await Order.find({ status: { $ne: 'cancelled' } }).select('totalPrice createdAt');
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  // Sales over last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentOrders = await Order.find({ 
    createdAt: { $gte: sevenDaysAgo },
    status: { $ne: 'cancelled' }
  });

  const dailySales = recentOrders.reduce((acc, order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + order.totalPrice;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      dailySales
    }
  });
}));

// @route   GET /api/analytics/sales
// @desc    Get detailed sales report
// @access  Private/Admin
router.get('/sales', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const salesByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } }
  ]);

  res.json({ success: true, data: salesByStatus });
}));

module.exports = router;
