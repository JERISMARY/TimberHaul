require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Blog = require('../models/Blog');
const slugify = require('slugify');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ARTIFACTS_DIR = 'C:\\Users\\jeris\\.gemini\\antigravity-ide\\brain\\fc5ec052-96bf-4633-b81c-477be11a5c60';

// Helper to find the latest file matching a prefix in the artifacts dir
function findLatestArtifact(prefix) {
  try {
    if (!fs.existsSync(ARTIFACTS_DIR)) return null;
    const files = fs.readdirSync(ARTIFACTS_DIR);
    const matches = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
    if (matches.length === 0) return null;
    
    // Sort by modification time (or just take the last one since timestamp is in name)
    matches.sort();
    return path.join(ARTIFACTS_DIR, matches[matches.length - 1]);
  } catch (err) {
    return null;
  }
}

// Upload to Cloudinary helper
async function uploadToCloudinary(filePath, folder) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  console.log(`📤 Uploading ${path.basename(filePath)} to Cloudinary...`);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `timberhaul/${folder}`
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error('❌ Cloudinary upload failed:', err.message);
    return null;
  }
}

const seedWithImages = async () => {
  await connectDB();
  console.log('🌱 Starting Cloudinary Seeding Process...');

  // 1. Drop collections
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    if (['categories', 'products', 'users', 'blogs'].includes(collection.collectionName)) {
      await collection.drop().catch(() => {});
    }
  }

  // 2. Create Users
  const admin = await User.create({
    name: 'TimberHaul Admin', email: 'admin@timberhaul.com', password: 'Admin@123', role: 'admin', isVerified: true
  });
  await User.create({
    name: 'John Doe', email: 'user@timberhaul.com', password: 'User@123', role: 'user', phone: '+91 98765 43210', isVerified: true
  });
  console.log('✅ Users created');

  // 3. Upload & Create Categories
  console.log('\n--- Processing Categories ---');
  const catData = [
    { name: 'Solid Wood', prefix: 'category_solid_wood' },
    { name: 'Plywood', prefix: 'category_plywood' },
    { name: 'Doors', prefix: 'category_doors' },
    { name: 'Furniture', prefix: 'category_furniture' },
    { name: 'Wooden Decor', prefix: 'category_decor' },
    { name: 'Construction Timber', prefix: 'category_construction' }
  ];

  const createdCategories = [];
  const categoryMap = {};

  for (let i = 0; i < catData.length; i++) {
    const item = catData[i];
    const localPath = findLatestArtifact(item.prefix);
    const cloudRes = await uploadToCloudinary(localPath, 'categories');
    const image = cloudRes ? cloudRes.url : 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80';
    
    const cat = await Category.create({
      name: item.name,
      slug: slugify(item.name, { lower: true }),
      description: `Premium ${item.name} materials`,
      image: image,
      featured: true,
      order: i + 1
    });
    createdCategories.push(cat);
    categoryMap[cat.name] = cat._id;
  }
  console.log(`✅ ${createdCategories.length} categories created`);

  // 4. Upload & Create Products
  console.log('\n--- Processing Products ---');
  const prodData = [
    { name: 'Premium Teak Hardwood Plank', cat: 'Solid Wood', woodType: 'Teak', prefix: 'product_teak_plank' },
    { name: 'Walnut Dining Table Top', cat: 'Furniture', woodType: 'Walnut', prefix: 'product_walnut_table' },
    { name: 'Marine Plywood 18mm BWR', cat: 'Plywood', woodType: 'Plywood', prefix: 'product_marine_plywood' },
    { name: 'Solid Oak Engineered Door', cat: 'Doors', woodType: 'Oak', prefix: 'product_oak_door' },
    { name: 'Mahogany Carved Wall Panel', cat: 'Wooden Decor', woodType: 'Mahogany', prefix: 'product_mahogany_panel' },
    { name: 'Structural Pine Beam 6x4', cat: 'Construction Timber', woodType: 'Pine', prefix: 'product_pine_beam' },
    { name: 'Rosewood Bookshelf Unit', cat: 'Furniture', woodType: 'Rosewood', prefix: 'product_rosewood_bookshelf' },
    { name: 'Oak Chevron Parquet Flooring', cat: 'Solid Wood', woodType: 'Oak', prefix: 'product_oak_flooring' }
  ];

  for (let p of prodData) {
    const localPath = findLatestArtifact(p.prefix);
    const cloudRes = await uploadToCloudinary(localPath, 'products');
    
    await Product.create({
      name: p.name,
      slug: slugify(p.name, { lower: true }),
      description: `High quality ${p.name}.`,
      shortDescription: p.name,
      category: categoryMap[p.cat],
      woodType: p.woodType,
      price: Math.floor(Math.random() * 20000) + 1000,
      stock: 50,
      images: cloudRes ? [{ url: cloudRes.url, publicId: cloudRes.publicId, isPrimary: true }] : [{ url: 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80', isPrimary: true }],
      featured: true,
      bestSeller: true
    });
  }
  console.log(`✅ ${prodData.length} products created`);

  // 5. Upload & Create Blogs
  console.log('\n--- Processing Blogs ---');
  const blogData = [
    { title: 'How to Maintain Your Wooden Furniture for a Lifetime', prefix: 'blog_wood_maintenance' },
    { title: 'Choosing the Right Timber for Your Construction Project', prefix: 'blog_choosing_timber' },
    { title: '2025 Furniture Design Trends', prefix: 'blog_furniture_trends' },
    { title: 'Construction Tips: Working with Large Timber Beams', prefix: 'blog_construction_tips' }
  ];

  for (let b of blogData) {
    const localPath = findLatestArtifact(b.prefix);
    const cloudRes = await uploadToCloudinary(localPath, 'blogs');
    
    await Blog.create({
      title: b.title,
      slug: slugify(b.title, { lower: true }),
      excerpt: b.title,
      content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
      coverImage: cloudRes ? cloudRes.url : 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80',
      category: 'Construction Tips',
      author: admin._id,
      status: 'published'
    });
  }
  console.log(`✅ ${blogData.length} blogs created`);

  console.log('\n🎉 Database perfectly seeded with Cloudinary Images!');
  process.exit(0);
};

seedWithImages().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
