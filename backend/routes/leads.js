const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const leads = await Lead.find().populate('salesRep', 'name email').sort('-createdAt');
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching leads' });
  }
});

// @desc    Create a lead
// @route   POST /api/leads
// @access  Public
router.post('/', async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json({ lead, message: 'Inquiry submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a lead (status, assign rep)
// @route   PUT /api/leads/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ lead });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Add a note to a lead
// @route   POST /api/leads/:id/notes
// @access  Private/Admin
router.post('/:id/notes', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.notes.push({
      text: req.body.text,
      addedBy: req.user._id
    });
    
    await lead.save();
    res.json({ lead });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
