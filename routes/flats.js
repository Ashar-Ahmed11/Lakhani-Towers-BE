const express = require('express');
const { body, validationResult } = require('express-validator');
const Flat = require('../models/flat');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post('/', fetchAdmin, [body('flatNumber').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const flat = await Flat.create(req.body);
    res.json(flat);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await Flat.find().sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Flat.findById(req.params.id);
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await Flat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Flat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


