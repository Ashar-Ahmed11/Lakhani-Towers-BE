const express = require('express');
const { body, validationResult } = require('express-validator');
const CustomHeaderRecord = require('../models/customHeaderRecord');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post(
  '/',
  fetchAdmin,
  [body('header').notEmpty(), body('amount').isNumeric()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await CustomHeaderRecord.create(req.body);
      res.json(item);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await CustomHeaderRecord.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'header' })
      .populate({ path: 'fromUser', select: 'userName userMobile' })
      .populate({ path: 'toUser', select: 'userName userMobile' })
      .populate({ path: 'fromAdmin', select: 'username email' })
      .populate({ path: 'toAdmin', select: 'username email' });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await CustomHeaderRecord.findById(req.params.id)
      .populate({ path: 'header' })
      .populate({ path: 'fromUser', select: 'userName userMobile' })
      .populate({ path: 'toUser', select: 'userName userMobile' })
      .populate({ path: 'fromAdmin', select: 'username email' })
      .populate({ path: 'toAdmin', select: 'username email' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await CustomHeaderRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await CustomHeaderRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


