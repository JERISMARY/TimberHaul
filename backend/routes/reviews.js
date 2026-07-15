const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/product/:productId', optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt', rating } = req.query;
  const query = { product: req.params.productId, isApproved: true };
  if (rating) query.rating = Number(rating);

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('user', 'name avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(query)
  ]);

  res.json({ success: true, reviews, total, pages: Math.ceil(total / limit) });
}));

router.post('/product/:productId', protect, asyncHandler(async (req, res) => {
  const { rating, title, comment, images } = req.body;
  const existing = await Review.findOne({ user: req.user._id, product: req.params.productId });
  if (existing) { res.status(400); throw new Error('You have already reviewed this product'); }

  const review = await Review.create({
    user: req.user._id,
    product: req.params.productId,
    rating, title, comment, images
  });

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
}));

router.put('/:id', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  if (review.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }

  Object.assign(review, req.body);
  await review.save();
  res.json({ success: true, review });
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
}));

router.post('/:id/helpful', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }

  const index = review.helpful.indexOf(req.user._id);
  if (index === -1) {
    review.helpful.push(req.user._id);
  } else {
    review.helpful.splice(index, 1);
  }
  review.helpfulCount = review.helpful.length;
  await review.save();
  res.json({ success: true, helpfulCount: review.helpfulCount });
}));

module.exports = router;
