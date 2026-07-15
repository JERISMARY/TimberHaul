const mongoose = require('mongoose');

const DimensionSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  thickness: Number,
  unit: { type: String, default: 'mm' }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: [200, 'Name max 200 chars'] },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 5000 },
  shortDescription: { type: String, maxlength: 300 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  woodType: {
    type: String,
    enum: ['Teak', 'Oak', 'Mahogany', 'Pine', 'Walnut', 'Rosewood', 'Mango', 'Sheesham', 'Bamboo', 'MDF', 'Plywood', 'Other'],
    required: true
  },
  dimensions: DimensionSchema,
  weight: { type: Number }, // kg
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 }, // percentage
  finalPrice: { type: Number },
  stock: { type: Number, required: true, default: 0, min: 0 },
  warranty: { type: String, default: '1 Year Standard Warranty' },
  finishOptions: [String],
  availableColors: [String],
  videoUrl: String,
  threeSixtyImageUrls: [String],
  images: [{
    url:       { type: String, required: true },   // Cloudinary URL or local path
    publicId:  { type: String },                   // Cloudinary public_id (for deletion)
    alt:       { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  tags: [String],
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  sustainabilityCertified: { type: Boolean, default: false },
  origin: String, // country/region of wood origin
  customizable: { type: Boolean, default: false },
  minOrderQty: { type: Number, default: 1 },
  unit: { type: String, default: 'piece' }, // piece, sq ft, cubic ft, kg
  specifications: [{ key: String, value: String }]
}, { timestamps: true });

const slugify = require('slugify');

ProductSchema.pre('save', function(next) {
  if (this.price !== undefined) {
    this.finalPrice = this.discount > 0
      ? Math.round(this.price * (1 - this.discount / 100))
      : this.price;
  }

  // Auto-generate slug safely using slugify
  if (this.isModified('name') && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, woodType: 1, finalPrice: 1 });
ProductSchema.index({ featured: 1, isActive: 1 });

module.exports = mongoose.model('Product', ProductSchema);
