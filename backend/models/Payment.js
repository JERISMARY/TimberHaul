const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['stripe', 'razorpay', 'upi', 'cod'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
  transactionId: String,
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  refundId: String,
  refundAmount: Number,
  refundReason: String,
  metadata: mongoose.Schema.Types.Mixed,
  failureReason: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
