const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { normalizeFile } = require('../middleware/upload');
const { deleteFromCloudinary } = require('../config/cloudinary');

// @route GET /api/products - Get all products with filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    search, category, woodType, minPrice, maxPrice,
    rating, featured, page = 1, limit = 12,
    sort = '-createdAt', inStock
  } = req.query;

  const query = { isActive: true };

  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (woodType) query.woodType = woodType;
  if (featured === 'true') query.featured = true;
  if (inStock === 'true') query.stock = { $gt: 0 };
  if (minPrice || maxPrice) {
    query.finalPrice = {};
    if (minPrice) query.finalPrice.$gte = Number(minPrice);
    if (maxPrice) query.finalPrice.$lte = Number(maxPrice);
  }
  if (rating) query.rating = { $gte: Number(rating) };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const defaultImage = 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80';

  const cleanedProducts = products.map(p => {
    let images = p.images || [];
    if (images.length === 0) images = [{ url: defaultImage, isPrimary: true }];
    images = images.map(img => ({
      url: (img.url && !img.url.startsWith('file://')) ? img.url : defaultImage,
      isPrimary: img.isPrimary || false
    }));

    return {
      ...p,
      images,
      image: images[0]?.url || defaultImage,
      thumbnail: images[0]?.url || defaultImage
    };
  });

  res.json({
    success: true,
    count: cleanedProducts.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    products: cleanedProducts
  });
}));

// @route GET /api/products/featured
router.get('/featured', asyncHandler(async (req, res) => {
  const defaultImage = 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80';
  const rawProducts = await Product.find({ featured: true, isActive: true })
    .populate('category', 'name')
    .limit(8).lean();

  const products = rawProducts.map(p => {
    let images = p.images || [];
    if (images.length === 0) images = [{ url: defaultImage, isPrimary: true }];
    images = images.map(img => ({
      url: (img.url && img.url.startsWith('http')) ? img.url : defaultImage,
      isPrimary: img.isPrimary || false
    }));
    return { ...p, images, image: images[0]?.url || defaultImage, thumbnail: images[0]?.url || defaultImage };
  });

  res.json({ success: true, products });
}));

// @route GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('supplier', 'name certifications');

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }

  const defaultImage = 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80';
  const pObj = product.toObject ? product.toObject() : product;
  let images = pObj.images || [];
  if (images.length === 0) images = [{ url: defaultImage, isPrimary: true }];
  images = images.map(img => ({
    url: (img.url && img.url.startsWith('http')) ? img.url : defaultImage,
    isPrimary: img.isPrimary || false
  }));
  pObj.images = images;
  pObj.image = images[0]?.url || defaultImage;
  pObj.thumbnail = images[0]?.url || defaultImage;

  res.json({ success: true, product: pObj });
}));

// @route POST /api/products - Admin create product
// Images are uploaded to Cloudinary (or local disk) via multer.
// The resulting URLs are stored in MongoDB Product.images[].url
router.post('/', protect, authorize('admin', 'manager'),
  upload.array('productImages', 10),
  asyncHandler(async (req, res) => {
    const productData = { ...req.body };

    // Parse array fields if they come as strings from FormData
    ['tags', 'seoKeywords', 'finishOptions', 'availableColors', 'threeSixtyImageUrls'].forEach(field => {
      if (typeof productData[field] === 'string') {
        try {
          productData[field] = JSON.parse(productData[field]);
        } catch(e) {
          productData[field] = productData[field].split(',').map(s => s.trim());
        }
      }
    });

    // Basic validation
    if (!productData.name || !productData.price || !productData.category || !productData.woodType) {
      res.status(400);
      throw new Error('Required: name, price, category, woodType');
    }

    if (!mongoose.Types.ObjectId.isValid(productData.category)) {
      res.status(400);
      throw new Error('Invalid category ObjectId');
    }

    // Handle uploaded images — URLs come from Cloudinary (or local)
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, idx) => ({
        ...normalizeFile(file, 'productImages', productData.name),
        isPrimary: idx === 0
      }));
    }

    // Parse nested JSON fields sent via FormData
    if (typeof productData.dimensions === 'string') {
      try { productData.dimensions = JSON.parse(productData.dimensions); } catch (e) {}
    }
    if (typeof productData.specifications === 'string') {
      try { productData.specifications = JSON.parse(productData.specifications); } catch (e) {}
    }
    if (typeof productData.tags === 'string') {
      try { productData.tags = JSON.parse(productData.tags); } catch (e) {
        productData.tags = productData.tags.split(',').map(t => t.trim());
      }
    }
    if (typeof productData.price === 'string') productData.price = Number(productData.price);
    if (typeof productData.stock === 'string') productData.stock = Number(productData.stock);
    if (typeof productData.discount === 'string') productData.discount = Number(productData.discount || 0);

    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  })
);

// @route PUT /api/products/:id - Admin update product
router.put('/:id', protect, authorize('admin', 'manager'),
  upload.array('productImages', 10),
  asyncHandler(async (req, res) => {
    let product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    const updateData = { ...req.body };
    
    // Parse array fields
    ['tags', 'seoKeywords', 'finishOptions', 'availableColors', 'threeSixtyImageUrls'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch(e) {
          updateData[field] = updateData[field].split(',').map(s => s.trim());
        }
      }
    });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, idx) => ({
        ...normalizeFile(file, 'productImages', updateData.name || product.name),
        isPrimary: idx === 0 && (!product.images || product.images.length === 0)
      }));
      updateData.images = [...(product.images || []), ...newImages];
    }

    if (typeof updateData.price === 'string')    updateData.price    = Number(updateData.price);
    if (typeof updateData.stock === 'string')    updateData.stock    = Number(updateData.stock);
    if (typeof updateData.discount === 'string') updateData.discount = Number(updateData.discount || 0);

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true
    });
    res.json({ success: true, product });
  })
);

// @route DELETE /api/products/:id/images/:imageId - Remove single image
router.delete('/:id/images/:imageId', protect, authorize('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    const image = product.images.id(req.params.imageId);
    if (!image) { res.status(404); throw new Error('Image not found'); }

    // Delete from Cloudinary if it has a publicId
    if (image.publicId) {
      await deleteFromCloudinary(image.publicId);
    }

    product.images.pull(req.params.imageId);
    await product.save();
    res.json({ success: true, images: product.images });
  })
);

// @route DELETE /api/products/:id - Soft delete
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Product deactivated' });
}));

// @route GET /api/products/:id/related
router.get('/:id/related', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const related = await Product.find({
    _id: { $ne: product._id },
    $or: [{ category: product.category }, { woodType: product.woodType }],
    isActive: true
  }).limit(6).lean();

  res.json({ success: true, products: related });
}));

module.exports = router;
