const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        name: user.name || (user.firstName + ' ' + user.lastName),
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        avatar: user.avatar || user.profileImage,
        phone: user.phone
      }
    });
};

// @route   POST /api/auth/register
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { firstName, lastName, username, email, password, phone } = req.body;
  const name = firstName + ' ' + lastName;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({ firstName, lastName, username, name, email, password, phone });
  
  // Generate verification token
  const verificationToken = user.getVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/verify-email.html?token=${verificationToken}`;

  // Send Welcome & Verification Email asynchronously
  sendEmail({
    email: user.email,
    subject: 'Welcome to TimberHaul! Please verify your email 🌲',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2a1b14; background-color: #fcfbf9; padding: 30px; border-radius: 8px; border: 1px solid #e8e2d9;">
        <h2 style="color: #6b4423;">Welcome to TimberHaul, ${user.firstName}!</h2>
        <p>We are thrilled to have you join our community.</p>
        <p>Please click the button below to verify your email address and activate your account.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #8b5a2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e8e2d9; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f6e62;">If the button doesn't work, copy and paste this link: ${verifyUrl}</p>
      </div>
    `
  });

  sendTokenResponse(user, 201, res);
}));

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
}));

// @route   GET /api/auth/me
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
}));

// @route   PUT /api/auth/profile
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const fields = ['firstName', 'lastName', 'username', 'name', 'phone', 'profileImage', 'avatar'];
  const updateData = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

  // Keep name synced if first/last are provided
  if (updateData.firstName || updateData.lastName) {
    const userToUpdate = await User.findById(req.user._id);
    const newFirst = updateData.firstName || userToUpdate.firstName;
    const newLast = updateData.lastName || userToUpdate.lastName;
    updateData.name = newFirst + ' ' + newLast;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true, runValidators: true
  });

  // If password is provided, update it separately (requires save() for bcrypt middleware)
  if (req.body.password && req.body.password.length >= 6) {
    const userDoc = await User.findById(req.user._id);
    userDoc.password = req.body.password;
    await userDoc.save();
  }

  res.json({ success: true, user });
}));

// @route   PUT /api/auth/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
}));

// @route   POST /api/auth/addresses
router.post('/addresses', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }
  user.addresses.push(req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));

// @route   DELETE /api/auth/addresses/:addressId
router.delete('/addresses/:addressId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @route   GET /api/auth/verify-email/:token
router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const crypto = require('crypto');
  const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email successfully verified' });
}));

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404);
    throw new Error('There is no user with that email');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/reset-password.html?token=${resetToken}`;

  const emailSent = await sendEmail({
    email: user.email,
    subject: 'Password Reset Request - TimberHaul',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2a1b14; background-color: #fcfbf9; padding: 30px; border-radius: 8px; border: 1px solid #e8e2d9;">
        <h2 style="color: #6b4423;">Password Reset</h2>
        <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
        <p>Please click the button below to set a new password. This link will expire in 10 minutes.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #8b5a2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `
  });

  if (!emailSent) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Email could not be sent');
  }

  res.json({ success: true, message: 'Password reset email sent' });
}));

// @route   PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const crypto = require('crypto');
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
}));

module.exports = router;
