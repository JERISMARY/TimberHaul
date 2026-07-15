/* ============================================================
   TimberHaul — Image Upload Route
   POST /api/upload — uploads to Cloudinary, returns URL
   URL is then stored in MongoDB by the calling service
   ============================================================ */

const express = require('express');
const router  = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { normalizeFile, isCloudinary } = require('../middleware/upload');

// @route  POST /api/upload/product-image   — upload product image
// @route  POST /api/upload/avatar          — upload user avatar
// @route  POST /api/upload/blog-image      — upload blog cover image
// @route  POST /api/upload/category-image  — upload category image
// @access Private (admin/manager for most; any user for avatar)

/**
 * Single image upload — returns { url, publicId }
 * The caller is responsible for saving the URL in MongoDB.
 */
router.post('/product-image',
  protect, authorize('admin', 'manager'),
  upload.single('productImages'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No image file provided'); }
    const image = normalizeFile(req.file, 'productImages', req.body.alt || '');
    res.json({ success: true, image, storage: isCloudinary ? 'cloudinary' : 'local' });
  })
);

router.post('/avatar',
  protect,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No image file provided'); }
    const image = normalizeFile(req.file, 'avatar', '');
    // Also update the user's avatar/profileImage in MongoDB
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { avatar: image.url, profileImage: image.url });
    res.json({ success: true, image, storage: isCloudinary ? 'cloudinary' : 'local' });
  })
);

router.post('/blog-image',
  protect, authorize('admin', 'manager'),
  upload.single('blogImage'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No image file provided'); }
    const image = normalizeFile(req.file, 'blogImage', req.body.alt || '');
    res.json({ success: true, image, storage: isCloudinary ? 'cloudinary' : 'local' });
  })
);

router.post('/category-image',
  protect, authorize('admin'),
  upload.single('categoryImage'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No image file provided'); }
    const image = normalizeFile(req.file, 'categoryImage', req.body.alt || '');
    res.json({ success: true, image, storage: isCloudinary ? 'cloudinary' : 'local' });
  })
);

// @route GET /api/upload/status — check if Cloudinary is configured
router.get('/status', protect, (req, res) => {
  res.json({
    success: true,
    cloudinaryConfigured: isCloudinary,
    storage: isCloudinary ? 'cloudinary' : 'local-disk',
    message: isCloudinary
      ? 'Images are uploaded to Cloudinary CDN, URLs stored in MongoDB'
      : 'Images are stored on local disk. Add Cloudinary credentials to .env to enable CDN.',
  });
});

module.exports = router;
