const express = require('express');
const { body, validationResult } = require('express-validator');
const Maintenance = require('../models/maintenance');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post(
  '/',
  fetchAdmin,
  [body('maintenancePurpose').notEmpty(), body('maintenanceAmount').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await Maintenance.create(req.body);
      res.json(item);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await Maintenance.find().sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Maintenance.findById(req.params.id);
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


