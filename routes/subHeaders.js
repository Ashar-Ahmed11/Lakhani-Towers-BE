const express = require('express');
const { body, validationResult } = require('express-validator');
const fetchAdmin = require('../middleware/fetchadmin');
const SubHeader = require('../models/subHeader');

const router = express.Router();

// Create
router.post(
  '/',
  fetchAdmin,
  [body('subHeaderName').notEmpty(), body('header').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await SubHeader.create({
        subHeaderName: req.body.subHeaderName,
        header: req.body.header,
      });
      res.json(item);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List
router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { q, headerId } = req.query;
    const query = {};
    if (headerId) query.header = headerId;
    if (q) query.subHeaderName = { $regex: q, $options: 'i' };
    const list = await SubHeader.find(query).sort({ createdAt: -1 }).populate({ path: 'header' });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get by id
router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await SubHeader.findById(req.params.id).populate({ path: 'header' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const payload = {};
    if (req.body.subHeaderName !== undefined) payload.subHeaderName = req.body.subHeaderName;
    if (req.body.header !== undefined) payload.header = req.body.header;
    const updated = await SubHeader.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await SubHeader.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


