const express = require('express');
const axios = require('axios');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { sendContactEmails } = require('../services/emailService');
const sendWhatsApp = require('../utils/sendWhatsApp');

router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const { recaptchaToken, ...messageData } = req.body;

  // reCAPTCHA v3 Validation (Scaffolding)
  if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
    try {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
      const response = await axios.post(verifyUrl);
      if (!response.data.success || response.data.score < 0.5) {
        res.status(400); throw new Error('reCAPTCHA verification failed. Please try again.');
      }
    } catch (error) {
      console.error('reCAPTCHA Error:', error.message);
      // Fail open or closed depending on preference; failing open for now to prevent breakage
    }
  }

  // Input Validation
  const { name, email, message: msgContent } = messageData;
  if (!name || !email || !msgContent) {
    res.status(400);
    throw new Error('Name, email, and message are required fields.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address.');
  }

  const message = await Message.create({ ...messageData, user: req.user?._id });

  // Send acknowledgement and admin emails asynchronously via the new email service
  sendContactEmails(message);

  // Admin WhatsApp Notification (Simulation)
  sendWhatsApp({
    phone: '+919965625663', // Admin phone number
    message: `🌲 TimberHaul Admin Alert\n\nNew ${message.type} received from ${message.name}.\n\nMessage: "${message.message.substring(0, 50)}..."\n\nPlease check the admin dashboard.`
  });

  res.status(201).json({ success: true, message: 'Message sent successfully', data: message });
}));

router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;

  const [messages, total] = await Promise.all([
    Message.find(query).populate('user', 'name email').sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit)).lean(),
    Message.countDocuments(query)
  ]);
  res.json({ success: true, messages, total });
}));

router.put('/:id/reply', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(req.params.id, {
    $push: { replies: { message: req.body.message, sentBy: req.user._id } },
    status: 'replied'
  }, { new: true });
  res.json({ success: true, message });
}));

router.put('/:id/status', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, message });
}));

module.exports = router;
