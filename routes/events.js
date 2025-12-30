const express = require('express');
const { body, validationResult } = require('express-validator');
const Events = require('../models/events');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

// Create
router.post(
  '/',
  fetchAdmin,
  [
    body('GivenFrom').notEmpty(),
    body('Event').notEmpty(),
    body('amount').isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      // assign unique 5-digit serialNumber
      const gen = () => Math.floor(10000 + Math.random() * 90000);
      let serial = null;
      for (let i = 0; i < 20; i++) {
        const cand = gen();
        // eslint-disable-next-line no-await-in-loop
        const exists = await Events.exists({ serialNumber: cand });
        if (!exists) { serial = cand; break; }
      }
      if (!serial) serial = gen();
      const payload = { ...req.body, serialNumber: serial };
      const created = await Events.create(payload);
      res.json(created);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List with optional filters: from, to, q (GivenFrom / Event)
router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { from, to, q } = req.query;
    const query = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23,59,59,999);
        query.createdAt.$lte = dt;
      }
    }
    if (q) {
      query.$or = [
        { GivenFrom: { $regex: String(q), $options: 'i' } },
        { Event: { $regex: String(q), $options: 'i' } },
      ];
    }
    const list = await Events.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get by id
router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Events.findById(req.params.id);
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await Events.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Receive amount for event (decrease amount, increase paidAmount)
router.post('/:id/receive', fetchAdmin, [body('amount').isNumeric()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const ev = await Events.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    const rec = Math.max(0, Number(req.body.amount || 0));
    const curAmt = Number(ev?.amount || 0);
    const curPaid = Number(ev?.paidAmount || 0);
    const nextAmt = Math.max(0, curAmt - rec);
    const nextPaid = curPaid + Math.min(rec, curAmt);
    ev.amount = nextAmt;
    ev.paidAmount = nextPaid;
    await ev.save();
    res.json(ev);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Events.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


