const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

// Create
router.post(
  '/',
  fetchAdmin,
  [body('userName').notEmpty(), body('userMobile').isNumeric()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = await User.create(req.body);
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Read all
router.get('/', fetchAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Read one
router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


