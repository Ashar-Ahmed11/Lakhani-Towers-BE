const express = require('express');
const { body, validationResult } = require('express-validator');
const Salary = require('../models/salary');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post(
  '/',
  fetchAdmin,
  [body('employee').notEmpty(), body('amount').isNumeric()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await Salary.create(req.body);
      res.json(item);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await Salary.find().sort({ createdAt: -1 }).populate('employee');
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Salary.findById(req.params.id).populate('employee');
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Salary.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


