const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 2000 },
  images: [String],
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  helpfulCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  reply: {
    text: String,
    repliedAt: Date,
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true });

// Prevent duplicate reviews
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update product rating after review save
ReviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count
    });
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
