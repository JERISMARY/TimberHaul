const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

router.get('/', asyncHandler(async (req, res) => {
  const defaultImage = 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80';
  const rawCats = await Category.find({ isActive: true }).sort('order').lean();
  const categories = rawCats.map(c => ({
    ...c,
    image: (c.image && c.image.startsWith('http')) ? c.image : defaultImage
  }));
  res.json({ success: true, categories });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) { res.status(404); throw new Error('Category not found'); }
  res.json({ success: true, category });
}));

router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
}));

router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, category });
}));

router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Category deactivated' });
}));

module.exports = router;
