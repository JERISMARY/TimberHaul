const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  slug: { type: String, unique: true, lowercase: true },
  excerpt: { type: String, maxlength: 500 },
  content: { type: String, required: true },
  coverImage: String,
  category: {
    type: String,
    enum: ['Wood Maintenance', 'Choosing Timber', 'Furniture Trends', 'Construction Tips', 'Sustainability', 'DIY', 'News'],
    default: 'News'
  },
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  views: { type: Number, default: 0 },
  readTime: Number, // minutes
  featured: { type: Boolean, default: false },
  seoTitle: String,
  seoDescription: String,
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    comment: String,
    createdAt: { type: Date, default: Date.now },
    isApproved: { type: Boolean, default: true }
  }]
}, { timestamps: true });

BlogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (this.isModified('content')) {
    // Estimate read time (avg 200 words/min)
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Blog', BlogSchema);
