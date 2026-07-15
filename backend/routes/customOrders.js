const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const CustomOrder = require('../models/CustomOrder');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const sendWhatsApp = require('../utils/sendWhatsApp');

// @route POST /api/custom-orders - Submit a new custom furniture request (Public/User)
router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const orderData = { ...req.body };
  if (req.user) {
    orderData.user = req.user._id;
  }

  const customOrder = await CustomOrder.create(orderData);

  // Notify Admin
  sendEmail({
    email: process.env.EMAIL_USER,
    subject: `New Custom Furniture Request - ${customOrder.furnitureType}`,
    html: `<p>A new custom furniture request has been submitted for a ${customOrder.woodType} ${customOrder.furnitureType}.</p><p>Please review in the admin dashboard to generate a quote.</p>`
  });

  sendWhatsApp({
    phone: '+919965625663',
    message: `🌲 TimberHaul Custom Order Alert\n\nNew request for ${customOrder.furnitureType} received.`
  });

  res.status(201).json({ success: true, customOrder });
}));

// @route GET /api/custom-orders - Get all custom orders (Admin)
router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const customOrders = await CustomOrder.find({}).populate('user', 'name email phone').sort('-createdAt');
  res.json({ success: true, customOrders });
}));

// @route PUT /api/custom-orders/:id/quote - Admin provides a quote
router.put('/:id/quote', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { quotedPrice, estimatedCompletionDays } = req.body;
  const customOrder = await CustomOrder.findById(req.params.id).populate('user', 'email name phone');

  if (!customOrder) { res.status(404); throw new Error('Order not found'); }

  customOrder.quotedPrice = quotedPrice;
  customOrder.estimatedCompletionDays = estimatedCompletionDays;
  customOrder.status = 'quoted';
  await customOrder.save();

  // Email customer their quote
  const customerEmail = customOrder.user?.email || customOrder.guestEmail;
  if (customerEmail) {
    sendEmail({
      email: customerEmail,
      subject: `Your TimberHaul Custom Furniture Quote is Ready!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e8e2d9; border-radius: 8px;">
          <h2 style="color: #6b4423;">Great News!</h2>
          <p>We've reviewed your request for the custom ${customOrder.furnitureType}.</p>
          <p><strong>Quoted Price:</strong> ₹${quotedPrice.toLocaleString('en-IN')}</p>
          <p><strong>Estimated Completion:</strong> ${estimatedCompletionDays} days</p>
          <p>Please log in to your dashboard or contact us to accept this quote and begin manufacturing.</p>
        </div>
      `
    });
  }

  res.json({ success: true, customOrder });
}));

// @route PUT /api/custom-orders/:id/status - Update manufacturing status
router.put('/:id/status', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const customOrder = await CustomOrder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, customOrder });
}));

module.exports = router;
