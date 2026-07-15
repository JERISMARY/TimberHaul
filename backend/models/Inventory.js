const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  currentStock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, default: 0 }, // items in pending orders
  availableStock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  reorderPoint: { type: Number, default: 5 },
  maxStock: Number,
  warehouse: { type: String, default: 'Main Warehouse' },
  location: String, // shelf/row location
  lastRestocked: Date,
  nextRestockDate: Date,
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  movements: [{
    type: { type: String, enum: ['in', 'out', 'adjustment', 'reserved', 'unreserved'] },
    quantity: Number,
    reason: String,
    reference: String, // order ID or PO number
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

InventorySchema.virtual('isLowStock').get(function() {
  return this.availableStock <= this.lowStockThreshold;
});

InventorySchema.pre('save', function(next) {
  this.availableStock = this.currentStock - this.reservedStock;
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);
