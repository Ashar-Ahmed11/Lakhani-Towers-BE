const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/shop');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

// User relations deprecated; Shop embeds owner/tenant/renter details now.

router.post('/', fetchAdmin, [body('shopNumber').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const gen = () => Math.floor(10000 + Math.random() * 90000);
    let serial = null;
    for (let i = 0; i < 20; i++) {
      const cand = gen();
      // eslint-disable-next-line no-await-in-loop
      const exists = await Shop.exists({ serialNumber: cand });
      if (!exists) { serial = cand; break; }
    }
    if (!serial) serial = gen();
    const payload = { ...req.body, serialNumber: serial };
    const created = await Shop.create(payload);
    res.json(created);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await Shop.find().sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Shop.findById(req.params.id);
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
    const id = req.params.id;
    await Shop.findByIdAndDelete(id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;





