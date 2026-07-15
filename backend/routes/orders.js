const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const sendWhatsApp = require('../utils/sendWhatsApp');
const PDFDocument = require('pdfkit');

// @route POST /api/orders - Place new order
router.post('/', protect, asyncHandler(async (req, res) => {
  // Accept both 'orderItems' (from frontend checkout) and 'items' (legacy)
  const rawItems = req.body.orderItems || req.body.items;
  const { shippingAddress, paymentMethod, couponCode } = req.body;

  if (!rawItems || rawItems.length === 0) {
    res.status(400); throw new Error('No order items');
  }

  let itemsPrice = 0;
  const orderItems = [];

  for (const item of rawItems) {
    // Support product by _id or product field
    const productId = item.product || item._id;
    const product = await Product.findById(productId);

    if (!product) {
      // Accept as-is for demo/offline operation (frontend mock items)
      const price = item.finalPrice || item.price || 0;
      itemsPrice += price * (item.quantity || 1);
      orderItems.push({
        product: productId,
        name: item.name || 'Product',
        image: item.image || item.images?.[0]?.url || '',
        price,
        quantity: item.quantity || 1,
        woodType: item.woodType || 'Other'
      });
      continue;
    }

    if (product.stock < (item.quantity || 1)) {
      res.status(400); throw new Error(`Insufficient stock for ${product.name}`);
    }

    const price = product.finalPrice || product.price;
    itemsPrice += price * (item.quantity || 1);
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price,
      quantity: item.quantity || 1,
      woodType: product.woodType
    });

    // Reduce stock
    product.stock -= (item.quantity || 1);
    await product.save();
  }

  // Use client-provided totals if present (checkout pre-calculated), else recalculate
  const shippingPrice = req.body.shippingPrice !== undefined
    ? Number(req.body.shippingPrice)
    : (itemsPrice > 5000 ? 0 : 299);

  const taxPrice = req.body.taxPrice !== undefined
    ? Number(req.body.taxPrice)
    : Math.round(itemsPrice * 0.18);

  const totalPrice = req.body.totalPrice !== undefined
    ? Number(req.body.totalPrice)
    : itemsPrice + shippingPrice + taxPrice;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    couponCode,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  // Send Order Confirmation Email asynchronously
  sendEmail({
    email: req.user.email,
    subject: `Order Confirmation - TimberHaul (#${order._id.toString().substring(0, 8)})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2a1b14; background-color: #fcfbf9; padding: 30px; border-radius: 8px; border: 1px solid #e8e2d9;">
        <h2 style="color: #6b4423;">Thank you for your order, ${req.user.name}!</h2>
        <p>Your premium timber order has been successfully placed and is being prepared for dispatch.</p>
        
        <div style="background: #ffffff; padding: 20px; border-radius: 4px; border: 1px solid #e8e2d9; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8b5a2b;">Order Summary</h3>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalPrice.toLocaleString('en-IN')}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}</p>
          <p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>
        </div>

        <p>You can track the status of your order in your <a href="${process.env.CLIENT_URL || 'http://localhost:5000'}/profile.html" style="color: #8b5a2b; font-weight: bold;">account profile</a>.</p>
        <p style="margin-top: 30px;">Warm regards,<br/><strong>The TimberHaul Team</strong></p>
      </div>
    `
  });

  // User WhatsApp Notification (Simulation)
  if (req.user.phone) {
    sendWhatsApp({
      phone: req.user.phone,
      message: `🌲 TimberHaul\n\nThank you ${req.user.name}!\nYour order #${order._id.toString().substring(0, 8)} for ₹${order.totalPrice.toLocaleString('en-IN')} has been confirmed.`
    });
  }

  // Admin WhatsApp Notification (Simulation)
  sendWhatsApp({
    phone: '+919965625663', // Admin phone number
    message: `🌲 TimberHaul Admin Alert\n\nNew order received!\nOrder ID: ${order._id}\nTotal: ₹${order.totalPrice.toLocaleString('en-IN')}\nCustomer: ${req.user.name}`
  });

  res.status(201).json({ success: true, order });
}));

// @route GET /api/orders/my - Get current user orders
router.get('/my', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('items.product', 'name images')
      .lean(),
    Order.countDocuments({ user: req.user._id })
  ]);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
}));

// @route GET /api/orders/:id - Get single order
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name images woodType');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  // Users can only see their own orders
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }

  res.json({ success: true, order });
}));

// @route PUT /api/orders/:id/pay - Mark order as paid (called by checkout after payment)
router.put('/:id/pay', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.paymentResult = {
    id: req.body.id || req.body.paymentId || `mock_${Date.now()}`,
    status: req.body.status || 'succeeded',
    updateTime: req.body.update_time || new Date().toISOString(),
    emailAddress: req.body.email_address || ''
  };
  order.paidAt = new Date();

  const updatedOrder = await order.save();
  res.json({ success: true, order: updatedOrder });
}));

// @route PUT /api/orders/:id/status - Admin update status
router.put('/:id/status', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status, trackingNumber, courier, location } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courier) order.courier = courier;
  if (status === 'delivered') order.deliveredAt = new Date();

  if (location && order.timeline && order.timeline.length > 0) {
    order.timeline[order.timeline.length - 1].location = location;
  }

  await order.save();

  // Notifications for Dispatch/Delivery
  if (status === 'dispatched' || status === 'delivered') {
    const actionText = status === 'dispatched' ? 'shipped' : 'delivered';
    const trackingInfo = trackingNumber ? `\nTracking Number: ${trackingNumber} (${courier || 'Standard'})` : '';

    // WhatsApp
    if (order.user.phone) {
      sendWhatsApp({
        phone: order.user.phone,
        message: `🌲 TimberHaul\n\nHi ${order.user.name},\nYour order #${order._id.toString().substring(0, 8)} has been ${actionText}!${trackingInfo}`
      });
    }

    // Email
    sendEmail({
      email: order.user.email,
      subject: `Order ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} - TimberHaul (#${order._id.toString().substring(0, 8)})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e8e2d9; border-radius: 8px;">
          <h2 style="color: #6b4423;">Great News, ${order.user.name}!</h2>
          <p>Your TimberHaul order has been <strong>${actionText}</strong>.</p>
          ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}<br/><strong>Courier:</strong> ${courier || 'Standard'}</p>` : ''}
          <p>You can check the full timeline in your profile.</p>
        </div>
      `
    });
  }

  res.json({ success: true, order });
}));

// @route GET /api/orders - Admin get all orders
router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query)
  ]);

  // Analytics
  const stats = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } }
  ]);

  res.json({ success: true, orders, total, stats, pages: Math.ceil(total / limit) });
}));

// @route PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }

  if (['dispatched', 'in_transit', 'delivered'].includes(order.status)) {
    res.status(400); throw new Error('Cannot cancel order at this stage');
  }

  order.status = 'cancelled';
  await order.save();

  // Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  res.json({ success: true, order });
}));

// @route GET /api/orders/:id/invoice
router.get('/:id/invoice', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name');

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'manager') {
    res.status(403); throw new Error('Not authorized to view this invoice');
  }

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-disposition', `attachment; filename=Invoice-${order._id}.pdf`);
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);

  // Header
  doc.fillColor('#444444').fontSize(20).text('TimberHaul', 50, 57)
    .fontSize(10).text('Premium Wood & Timber Supply', 50, 80)
    .text('123 Forest Avenue, Wood City', 50, 95)
    .fontSize(10).text(`Invoice Number: ${order._id}`, 200, 50, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 200, 65, { align: 'right' })
    .text(`Payment: ${order.paymentMethod}`, 200, 80, { align: 'right' });

  doc.moveDown();
  doc.moveTo(50, 120).lineTo(550, 120).stroke();

  // Customer Info
  doc.fontSize(12).fillColor('#333333').text('Bill To:', 50, 140)
    .fontSize(10).text(req.user.name, 50, 155)
    .text(req.user.email, 50, 170)
    .text(order.shippingAddress.addressLine1, 50, 185)
    .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`, 50, 200);

  // Table Setup
  let top = 250;
  doc.font('Helvetica-Bold').text('Item', 50, top)
    .text('Price', 280, top, { width: 90, align: 'right' })
    .text('Qty', 370, top, { width: 90, align: 'right' })
    .text('Total', 470, top, { width: 80, align: 'right' });

  doc.moveTo(50, top + 15).lineTo(550, top + 15).stroke();

  // Items
  top += 25;
  doc.font('Helvetica');
  order.items.forEach(item => {
    doc.text(item.name, 50, top)
      .text(`Rs. ${item.price.toLocaleString('en-IN')}`, 280, top, { width: 90, align: 'right' })
      .text(item.quantity.toString(), 370, top, { width: 90, align: 'right' })
      .text(`Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}`, 470, top, { width: 80, align: 'right' });
    top += 20;
  });

  doc.moveTo(50, top + 10).lineTo(550, top + 10).stroke();

  // Totals
  top += 25;
  doc.font('Helvetica-Bold')
    .text('Subtotal:', 370, top, { width: 90, align: 'right' })
    .text(`Rs. ${order.itemsPrice.toLocaleString('en-IN')}`, 470, top, { width: 80, align: 'right' });

  doc.text('Shipping:', 370, top + 20, { width: 90, align: 'right' })
    .text(`Rs. ${order.shippingPrice.toLocaleString('en-IN')}`, 470, top + 20, { width: 80, align: 'right' });

  doc.text('GST (18%):', 370, top + 40, { width: 90, align: 'right' })
    .text(`Rs. ${order.taxPrice.toLocaleString('en-IN')}`, 470, top + 40, { width: 80, align: 'right' });

  doc.fontSize(14).fillColor('#6b4423').text('Total:', 370, top + 70, { width: 90, align: 'right' })
    .text(`Rs. ${order.totalPrice.toLocaleString('en-IN')}`, 470, top + 70, { width: 80, align: 'right' });

  // Footer
  doc.fontSize(10).fillColor('#888888').text('Thank you for choosing TimberHaul.', 50, 700, { align: 'center' });

  doc.end();
}));

module.exports = router;
