const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// Guard payment SDK initialization — only instantiate with real keys
const DEMO_MODE = process.env.DEMO_PAYMENT_MODE === 'true';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = (!DEMO_MODE && stripeKey && !stripeKey.includes('your_')) ? require('stripe')(stripeKey) : null;

const rzpKeyId     = process.env.RAZORPAY_KEY_ID;
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
const Razorpay = require('razorpay');
const razorpay = (!DEMO_MODE && rzpKeyId && !rzpKeyId.includes('your_') && rzpKeySecret && !rzpKeySecret.includes('your_'))
  ? new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret })
  : null;

if (DEMO_MODE) console.log('🎮 Payment Demo Mode ACTIVE — all online payments are simulated');

// @route POST /api/payments/stripe/create-intent
router.post('/stripe/create-intent', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (!stripe) {
    console.warn('⚠️ Stripe not configured, simulating intent creation');
    return res.json({ success: true, clientSecret: `mock_secret_${Date.now()}` });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.totalPrice * 100, // paise
    currency: 'inr',
    metadata: { orderId: orderId.toString(), userId: req.user._id.toString() }
  });

  await Payment.create({
    order: orderId,
    user: req.user._id,
    method: 'stripe',
    amount: order.totalPrice,
    transactionId: paymentIntent.id,
    status: 'processing'
  });

  res.json({ success: true, clientSecret: paymentIntent.client_secret });
}));

// @route POST /api/payments/stripe/confirm
router.post('/stripe/confirm', protect, asyncHandler(async (req, res) => {
  const { orderId, paymentIntentId } = req.body;

  if (!stripe) {
    console.warn('⚠️ Stripe not configured, simulating confirmation');
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      status: 'confirmed',
      paymentResult: { id: paymentIntentId, status: 'succeeded', updateTime: new Date().toISOString() }
    });
    return res.json({ success: true, message: 'Mock Payment confirmed' });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      status: 'confirmed',
      paymentResult: { id: paymentIntentId, status: 'succeeded', updateTime: new Date().toISOString() }
    });
    await Payment.findOneAndUpdate({ transactionId: paymentIntentId }, { status: 'completed' });
    res.json({ success: true, message: 'Payment confirmed' });
  } else {
    res.status(400);
    throw new Error('Payment not completed');
  }
}));

// @route POST /api/payments/razorpay/create-order
router.post('/razorpay/create-order', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (!razorpay) {
    console.warn('⚠️ Razorpay not configured, simulating order creation');
    return res.json({
      success: true,
      orderId: `mock_rzp_${Date.now()}`,
      amount: order.totalPrice * 100,
      currency: 'INR',
      keyId: 'mock_key'
    });
  }

  const rzpOrder = await razorpay.orders.create({
    amount: order.totalPrice * 100,
    currency: 'INR',
    receipt: order.orderNumber || orderId.toString()
  });

  await Payment.create({
    order: orderId,
    user: req.user._id,
    method: 'razorpay',
    amount: order.totalPrice,
    gatewayOrderId: rzpOrder.id,
    status: 'processing'
  });

  res.json({
    success: true,
    orderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID
  });
}));

// @route POST /api/payments/razorpay/verify
router.post('/razorpay/verify', protect, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay) {
    console.warn('⚠️ Razorpay not configured, simulating verification');
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      status: 'confirmed',
      paymentResult: { id: razorpay_payment_id || 'mock_pay_id', status: 'captured', updateTime: new Date().toISOString() }
    });
    return res.json({ success: true, message: 'Mock Payment verified successfully' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400); throw new Error('Payment verification failed - invalid signature');
  }

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'paid',
    status: 'confirmed',
    paymentResult: { id: razorpay_payment_id, status: 'captured', updateTime: new Date().toISOString() }
  });

  await Payment.findOneAndUpdate(
    { gatewayOrderId: razorpay_order_id },
    { status: 'completed', gatewayPaymentId: razorpay_payment_id, gatewaySignature: razorpay_signature }
  );

  res.json({ success: true, message: 'Payment verified successfully' });
}));

// @route POST /api/payments/cod/confirm
router.post('/cod/confirm', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  await Order.findByIdAndUpdate(orderId, { paymentMethod: 'cod', status: 'confirmed' });
  await Payment.create({
    order: orderId,
    user: req.user._id,
    method: 'cod',
    amount: (await Order.findById(orderId)).totalPrice,
    status: 'pending'
  });
  res.json({ success: true, message: 'COD order confirmed' });
}));

module.exports = router;
