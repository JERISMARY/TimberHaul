const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middleware/auth');

router.get('/', protect, asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate('products.product', 'name price finalPrice images woodType rating stock');
  res.json({ success: true, wishlist: wishlist || { products: [] } });
}));

router.post('/toggle/:productId', protect, asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });

  const index = wishlist.products.findIndex(p => p.product.toString() === req.params.productId);
  let action;

  if (index === -1) {
    wishlist.products.push({ product: req.params.productId });
    action = 'added';
  } else {
    wishlist.products.splice(index, 1);
    action = 'removed';
  }

  await wishlist.save();
  res.json({ success: true, action, count: wishlist.products.length });
}));

router.delete('/clear', protect, asyncHandler(async (req, res) => {
  await Wishlist.findOneAndUpdate({ user: req.user._id }, { products: [] });
  res.json({ success: true, message: 'Wishlist cleared' });
}));

module.exports = router;
