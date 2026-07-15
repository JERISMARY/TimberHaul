require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Blog = require('../models/Blog');

const categories = [
  { name: 'Solid Wood', slug: 'solid-wood', description: 'Premium natural solid wood in various species', image: 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80', featured: true, order: 1 },
  { name: 'Plywood', slug: 'plywood', description: 'High-quality plywood for construction and furniture', image: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80', featured: true, order: 2 },
  { name: 'Doors', slug: 'doors', description: 'Wooden doors for residential and commercial use', image: 'https://images.unsplash.com/photo-1512212621149-107ffe5765fd?auto=format&fit=crop&w=800&q=80', featured: true, order: 3 },
  { name: 'Furniture', slug: 'furniture', description: 'Handcrafted premium wooden furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', featured: true, order: 4 },
  { name: 'Wooden Decor', slug: 'wooden-decor', description: 'Elegant wooden decorative items', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', featured: true, order: 5 },
  { name: 'Construction Timber', slug: 'construction-timber', description: 'Structural timber for construction projects', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80', featured: true, order: 6 }
];

const seedProducts = (categoryMap) => [
  {
    name: 'Premium Teak Hardwood Plank',
    description: 'Grade A teak hardwood plank sourced from sustainable plantations. Naturally weather-resistant with beautiful golden-brown grain. Perfect for outdoor furniture, decking, and marine applications.',
    shortDescription: 'Grade A teak hardwood - weather resistant, golden grain',
    category: categoryMap['Solid Wood'],
    woodType: 'Teak',
    dimensions: { length: 2400, width: 150, thickness: 25, unit: 'mm' },
    weight: 8.2,
    price: 4800,
    discount: 10,
    stock: 85,
    images: [{ url: 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80', alt: 'Teak Hardwood Plank', isPrimary: true }],
    featured: true, bestSeller: true,
    tags: ['teak', 'hardwood', 'outdoor', 'marine', 'plank'],
    sustainabilityCertified: true, origin: 'Myanmar',
    seoTitle: 'Premium Teak Hardwood Plank | TimberHaul',
    specifications: [{ key: 'Janka Hardness', value: '1070 lbf' }, { key: 'Moisture Content', value: '<12%' }]
  },
  {
    name: 'Walnut Dining Table Top',
    description: 'Exquisite American black walnut dining table top with live edge. Hand-finished with natural oil for a rich, deep luster. Each piece is unique with natural grain patterns.',
    shortDescription: 'Live-edge American black walnut, hand oil-finished',
    category: categoryMap['Furniture'],
    woodType: 'Walnut',
    dimensions: { length: 1800, width: 900, thickness: 50, unit: 'mm' },
    weight: 32.5,
    price: 28000,
    discount: 5,
    stock: 12,
    images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', alt: 'Walnut Dining Table', isPrimary: true }],
    featured: true,
    tags: ['walnut', 'dining', 'table', 'live-edge', 'luxury'],
    sustainabilityCertified: true, origin: 'USA',
    seoTitle: 'Live Edge Walnut Dining Table Top | TimberHaul',
    specifications: [{ key: 'Finish', value: 'Danish Oil' }, { key: 'Grade', value: 'Select & Better' }]
  },
  {
    name: 'Marine Plywood 18mm BWR',
    description: 'Boiling Water Resistant (BWR) marine grade plywood. Made from 100% hardwood veneers with phenol formaldehyde glue. IS:710 certified for maximum durability.',
    shortDescription: 'IS:710 certified BWR marine plywood, 18mm',
    category: categoryMap['Plywood'],
    woodType: 'Plywood',
    dimensions: { length: 2400, width: 1200, thickness: 18, unit: 'mm' },
    weight: 26,
    price: 3200,
    discount: 0,
    stock: 200,
    images: [{ url: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80', alt: 'Marine Plywood', isPrimary: true }],
    featured: false, bestSeller: true,
    tags: ['plywood', 'marine', 'BWR', 'waterproof', 'IS710'],
    sustainabilityCertified: false, origin: 'India',
    specifications: [{ key: 'Grade', value: 'BWR (IS:710)' }, { key: 'Glue', value: 'Phenol Formaldehyde' }]
  },
  {
    name: 'Solid Oak Engineered Door',
    description: 'Solid core engineered oak door with stunning veneer finish. Pre-hung with heavy-duty stainless hinges. Provides excellent insulation and soundproofing.',
    shortDescription: 'Solid core oak door with premium veneer finish',
    category: categoryMap['Doors'],
    woodType: 'Oak',
    dimensions: { length: 2100, width: 900, thickness: 45, unit: 'mm' },
    weight: 42,
    price: 15500,
    discount: 15,
    stock: 30,
    images: [{ url: 'https://images.unsplash.com/photo-1512212621149-107ffe5765fd?auto=format&fit=crop&w=800&q=80', alt: 'Oak Engineered Door', isPrimary: true }],
    featured: true,
    tags: ['oak', 'door', 'engineered', 'solid-core', 'soundproof'],
    sustainabilityCertified: true, origin: 'Europe',
    specifications: [{ key: 'Core', value: 'Solid Timber Frame' }, { key: 'STC Rating', value: '38 dB' }]
  },
  {
    name: 'Mahogany Carved Wall Panel',
    description: 'Hand-carved mahogany wall panel with traditional motifs. Perfect for luxury interiors, hotel lobbies, and heritage spaces. Each panel is unique artisan work.',
    shortDescription: 'Hand-carved mahogany panel, traditional motifs',
    category: categoryMap['Wooden Decor'],
    woodType: 'Mahogany',
    dimensions: { length: 1200, width: 600, thickness: 20, unit: 'mm' },
    weight: 15,
    price: 8900,
    discount: 0,
    stock: 18,
    images: [{ url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', alt: 'Mahogany Wall Panel', isPrimary: true }],
    featured: true,
    tags: ['mahogany', 'carved', 'wall', 'decor', 'luxury', 'artisan'],
    sustainabilityCertified: true, origin: 'India',
    specifications: [{ key: 'Finish', value: 'Natural Lacquer' }, { key: 'Carving', value: 'Handmade' }]
  },
  {
    name: 'Structural Pine Beam 6x4',
    description: 'Kiln-dried structural pine timber for construction. Straight grain, minimal knots, treated against insects and moisture. Ideal for roof trusses and framing.',
    shortDescription: 'Kiln-dried, treated structural pine for construction',
    category: categoryMap['Construction Timber'],
    woodType: 'Pine',
    dimensions: { length: 3000, width: 100, thickness: 150, unit: 'mm' },
    weight: 18,
    price: 2200,
    discount: 8,
    stock: 350,
    images: [{ url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80', alt: 'Structural Pine Beam', isPrimary: true }],
    featured: false, bestSeller: true,
    tags: ['pine', 'structural', 'beam', 'construction', 'framing'],
    sustainabilityCertified: true, origin: 'New Zealand',
    specifications: [{ key: 'Treatment', value: 'H3.2 CCA' }, { key: 'Grade', value: 'MGP10' }]
  },
  {
    name: 'Rosewood Bookshelf Unit',
    description: 'Premium rosewood 5-tier bookshelf with brass inlay details. Dovetail joinery and mortise-and-tenon construction for lifetime durability.',
    shortDescription: '5-tier rosewood shelf with brass inlay, dovetail joints',
    category: categoryMap['Furniture'],
    woodType: 'Rosewood',
    dimensions: { length: 1000, width: 350, thickness: 1800, unit: 'mm' },
    weight: 48,
    price: 22000,
    discount: 12,
    stock: 8,
    images: [{ url: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80', alt: 'Rosewood Bookshelf', isPrimary: true }],
    featured: true,
    tags: ['rosewood', 'bookshelf', 'storage', 'luxury', 'brass'],
    sustainabilityCertified: true, origin: 'India',
    specifications: [{ key: 'Joinery', value: 'Dovetail + M&T' }, { key: 'Finish', value: 'French Polish' }]
  },
  {
    name: 'Oak Chevron Parquet Flooring',
    description: 'Engineered oak chevron parquet flooring with UV-lacquer finish. Pre-sanded and pre-finished for easy installation. 14mm thickness for underfloor heating compatibility.',
    shortDescription: 'Engineered oak chevron parquet, pre-finished, 14mm',
    category: categoryMap['Solid Wood'],
    woodType: 'Oak',
    dimensions: { length: 580, width: 70, thickness: 14, unit: 'mm' },
    weight: 0.8,
    price: 1850,
    discount: 5,
    stock: 500,
    images: [{ url: 'https://images.unsplash.com/photo-1581858326451-83141f021271?auto=format&fit=crop&w=800&q=80', alt: 'Oak Chevron Flooring', isPrimary: true }],
    featured: true, bestSeller: true,
    tags: ['oak', 'flooring', 'parquet', 'chevron', 'engineered'],
    sustainabilityCertified: true, origin: 'France',
    unit: 'sq ft',
    specifications: [{ key: 'Finish', value: 'UV Lacquer' }, { key: 'Underfloor Heating', value: 'Compatible' }]
  }
];

const blogs = (adminId) => [
  {
    title: 'How to Maintain Your Wooden Furniture for a Lifetime',
    slug: 'how-to-maintain-wooden-furniture',
    excerpt: 'Learn professional wood care techniques to keep your furniture looking pristine for decades.',
    content: `<h2>The Art of Wood Maintenance</h2><p>Proper maintenance of wooden furniture is an investment that pays dividends for generations. Unlike synthetic materials, wood is a living material that breathes and responds to its environment...</p><p>Start with regular dusting using a microfiber cloth, followed by periodic conditioning with quality wood oil. Avoid placing wood near direct heat sources or in areas with extreme humidity fluctuations.</p><h2>Essential Tools</h2><ul><li>Quality microfiber cloths</li><li>Danish oil or teak oil</li><li>Fine-grit sandpaper (220 grit)</li><li>Beeswax polish</li></ul>`,
    coverImage: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800&q=80',
    category: 'Wood Maintenance',
    tags: ['maintenance', 'furniture', 'care', 'tips'],
    author: adminId,
    status: 'published',
    featured: true,
    views: 1245,
    seoTitle: 'Wood Furniture Maintenance Guide | TimberHaul Blog'
  },
  {
    title: 'Choosing the Right Timber for Your Construction Project',
    slug: 'choosing-right-timber-construction',
    excerpt: 'A comprehensive guide to selecting the perfect wood species for structural and aesthetic applications.',
    content: `<h2>Understanding Wood Grades</h2><p>Not all timber is created equal. Understanding grading systems is crucial for project success...</p><p>For structural applications, look for timber graded MGP10 or higher. Aesthetic projects allow more flexibility in grade selection.</p>`,
    coverImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    category: 'Choosing Timber',
    tags: ['construction', 'selection', 'grades', 'species'],
    author: adminId,
    status: 'published',
    featured: true,
    views: 892,
    seoTitle: 'How to Choose Timber for Construction | TimberHaul'
  },
  {
    title: '2025 Furniture Design Trends: Natural Wood Takes Center Stage',
    slug: 'furniture-design-trends-2025',
    excerpt: 'Discover the hottest furniture trends of 2025, where organic materials and biophilic design dominate.',
    content: `<h2>Biophilic Design Movement</h2><p>2025 marks the year that biophilic design moved from trend to mainstream standard. Designers across the globe are incorporating raw, natural wood elements...</p>`,
    coverImage: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
    category: 'Furniture Trends',
    tags: ['trends', '2025', 'design', 'biophilic', 'interior'],
    author: adminId,
    status: 'published',
    featured: false,
    views: 634
  },
  {
    title: 'Construction Tips: Working with Large Timber Beams',
    slug: 'construction-tips-timber-beams',
    excerpt: 'Expert advice on handling, cutting, and installing heavy timber beams safely and efficiently.',
    content: `<h2>Safety First</h2><p>Working with heavy timber requires proper planning and equipment. Always use appropriate lifting equipment for beams over 50kg...</p>`,
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    category: 'Construction Tips',
    tags: ['construction', 'beams', 'tips', 'safety'],
    author: adminId,
    status: 'published',
    featured: false,
    views: 421
  }
];

const slugify = require('slugify');

const seedDB = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Drop collections to completely clear old data and reset indexes
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    if (['categories', 'products', 'users', 'blogs'].includes(collection.collectionName)) {
      await collection.drop().catch(() => {});
    }
  }

  // Create admin
  const admin = await User.create({
    name: 'TimberHaul Admin',
    email: 'admin@timberhaul.com',
    password: 'Admin@123',
    role: 'admin',
    isVerified: true
  });
  console.log('✅ Admin created: admin@timberhaul.com / Admin@123');

  // Create demo user
  await User.create({
    name: 'John Doe',
    email: 'user@timberhaul.com',
    password: 'User@123',
    role: 'user',
    phone: '+91 98765 43210',
    isVerified: true
  });
  console.log('✅ Demo user created: user@timberhaul.com / User@123');

  // Create categories
  const createdCategories = await Category.insertMany(categories);
  const categoryMap = {};
  createdCategories.forEach(c => { categoryMap[c.name] = c._id; });
  console.log(`✅ ${createdCategories.length} categories created`);

  // Create products (pre-generate slugs to avoid E11000 null duplicate errors with insertMany)
  const products = seedProducts(categoryMap).map(p => {
    p.slug = slugify(p.name, { lower: true, strict: true });
    return p;
  });
  const createdProducts = await Product.insertMany(products);
  console.log(`✅ ${createdProducts.length} products created`);

  // Create blogs
  const createdBlogs = await Blog.insertMany(blogs(admin._id));
  console.log(`✅ ${createdBlogs.length} blogs created`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('📊 Collections populated: users, categories, products, blogs');
  process.exit(0);
};

seedDB().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
