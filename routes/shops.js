const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/shop');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post('/', fetchAdmin, [body('shopNumber').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const created = await Shop.create(req.body);
    res.json(created);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await Shop.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'owners.user', select: 'userName userMobile' })
      .populate({ path: 'tenant.user', select: 'userName userMobile' })
      .populate({ path: 'renter.user', select: 'userName userMobile' });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Shop.findById(req.params.id)
      .populate({ path: 'owners.user', select: 'userName userMobile' })
      .populate({ path: 'tenant.user', select: 'userName userMobile' })
      .populate({ path: 'renter.user', select: 'userName userMobile' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;





