const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  woodType: String,
  dimensions: String
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  address:      String,   // from checkout.js (combined address line)
  addressLine1: String,   // alias
  addressLine2: String,
  city: String,
  state: String,
  zipCode: String,        // from checkout.js
  pincode: String,        // alias
  country: { type: String, default: 'India' }
}, { _id: false });

const TimelineEventSchema = new mongoose.Schema({
  status: String,
  description: String,
  timestamp: { type: Date, default: Date.now },
  location: String
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'upi', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: String,
    emailAddress: String
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'manufacturing', 'packed', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'placed'
  },
  timeline: [TimelineEventSchema],
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: String,
  totalPrice: { type: Number, required: true },
  estimatedDelivery: Date,
  deliveredAt: Date,
  paidAt: Date,
  notes: String,
  trackingNumber: String,
  courier: String
}, { timestamps: true });

// Generate order number before save
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `TH-${String(count + 1).padStart(6, '0')}`;
  }
  // Auto-add timeline event on status change
  if (this.isModified('status')) {
    const statusMessages = {
      placed: 'Order placed successfully',
      confirmed: 'Order confirmed by seller',
      processing: 'Order is being processed',
      manufacturing: 'Custom product is currently in manufacturing',
      packed: 'Order is packed and ready for dispatch',
      dispatched: 'Order dispatched from warehouse',
      in_transit: 'Order is in transit',
      out_for_delivery: 'Order out for delivery',
      delivered: 'Order delivered successfully',
      cancelled: 'Order cancelled',
      returned: 'Order returned'
    };
    this.timeline.push({
      status: this.status,
      description: statusMessages[this.status] || this.status,
      timestamp: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
