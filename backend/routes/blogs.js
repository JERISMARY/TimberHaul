const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');
const { protect, authorize } = require('../middleware/auth');

router.get('/', asyncHandler(async (req, res) => {
  const { category, featured, page = 1, limit = 9 } = req.query;
  const query = { status: 'published' };
  if (category) query.category = category;
  if (featured === 'true') query.featured = true;

  const [blogs, total] = await Promise.all([
    Blog.find(query).populate('author', 'name avatar').sort('-publishedAt')
      .skip((page - 1) * limit).limit(Number(limit)).lean(),
    Blog.countDocuments(query)
  ]);
  res.json({ success: true, blogs, total, pages: Math.ceil(total / limit) });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
    .populate('author', 'name avatar');
  if (!blog) { res.status(404); throw new Error('Blog not found'); }
  blog.views += 1;
  await blog.save({ validateBeforeSave: false });
  res.json({ success: true, blog });
}));

router.post('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const blog = await Blog.create({ ...req.body, author: req.user._id });
  res.status(201).json({ success: true, blog });
}));

router.put('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, blog });
}));

router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, { status: 'archived' });
  res.json({ success: true, message: 'Blog archived' });
}));

module.exports = router;
