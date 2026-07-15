const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const getCart = async (userId) => Cart.findOne({ user: userId }).populate('items.product', 'name images price finalPrice woodType stock');

router.get('/', protect, asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id) || { items: [], totalItems: 0, subtotal: 0 };
  res.json({ success: true, cart });
}));

router.post('/add', protect, asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.stock < quantity) { res.status(400); throw new Error(`Only ${product.stock} items available`); }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingItem = cart.items.find(i => i.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.finalPrice || product.price,
      name: product.name,
      image: product.images?.[0]?.url || '',
      woodType: product.woodType
    });
  }

  await cart.save();
  await cart.populate('items.product', 'name images price finalPrice woodType stock');
  
  // Send email notification for adding to cart
  sendEmail({
    email: req.user.email,
    subject: `You added ${product.name} to your cart! 🛒`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2a1b14; background-color: #fcfbf9; padding: 30px; border-radius: 8px; border: 1px solid #e8e2d9;">
        <h2 style="color: #6b4423;">Great choice, ${req.user.name}!</h2>
        <p>You just added <strong>${quantity}x ${product.name}</strong> to your TimberHaul cart.</p>
        <p>This premium ${product.woodType} item is currently in stock, but our luxury wood selections sell out fast!</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5000'}/cart.html" style="background-color: #8b5a2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Cart & Checkout</a>
        </div>
      </div>
    `
  });

  res.json({ success: true, cart });
}));

router.put('/update/:productId', protect, asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }

  const item = cart.items.find(i => i.product.toString() === req.params.productId);
  if (!item) { res.status(404); throw new Error('Item not in cart'); }

  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  res.json({ success: true, cart });
}));

router.delete('/remove/:productId', protect, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
  }
  res.json({ success: true, cart });
}));

router.delete('/clear', protect, asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], couponCode: null, couponDiscount: 0 });
  res.json({ success: true, message: 'Cart cleared' });
}));

router.post('/coupon', protect, asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  // Basic coupon logic - extend with Coupon model
  const validCoupons = {
    'TIMBER10': 10, 'WOOD20': 20, 'NEWUSER15': 15, 'LUXURY25': 25
  };
  const discount = validCoupons[couponCode?.toUpperCase()];
  if (!discount) { res.status(400); throw new Error('Invalid or expired coupon code'); }

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.couponCode = couponCode.toUpperCase();
    cart.couponDiscount = discount;
    await cart.save();
  }

  res.json({ success: true, discount, message: `Coupon applied! ${discount}% off` });
}));

module.exports = router;
