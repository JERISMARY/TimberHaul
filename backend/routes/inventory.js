const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Inventory = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { lowStock, page = 1, limit = 20 } = req.query;
  const inventory = await Inventory.find({})
    .populate('product', 'name images woodType stock')
    .populate('supplier', 'name')
    .sort('availableStock')
    .lean();

  const withAlerts = inventory.map(inv => ({
    ...inv,
    isLowStock: inv.availableStock <= inv.lowStockThreshold,
    isCritical: inv.availableStock <= inv.reorderPoint
  }));

  const filtered = lowStock === 'true'
    ? withAlerts.filter(i => i.isLowStock)
    : withAlerts;

  res.json({ success: true, inventory: filtered, total: filtered.length });
}));

router.post('/restock', protect, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { productId, quantity, supplier, notes } = req.body;
  const inv = await Inventory.findOneAndUpdate(
    { product: productId },
    {
      $inc: { currentStock: quantity },
      $push: {
        movements: {
          type: 'in', quantity, reason: notes || 'Restock',
          reference: `PO-${Date.now()}`, performedBy: req.user._id
        }
      },
      lastRestocked: new Date()
    },
    { new: true, upsert: true }
  );
  res.json({ success: true, inventory: inv });
}));

module.exports = router;
