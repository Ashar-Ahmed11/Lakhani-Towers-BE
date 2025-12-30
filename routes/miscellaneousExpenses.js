const express = require('express');
const { body, validationResult } = require('express-validator');
const MiscellaneousExpense = require('../models/miscellaneousExpense');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

// Create
router.post(
  '/',
  fetchAdmin,
  [body('GivenTo').notEmpty(), body('lineItem').notEmpty(), body('amount').isNumeric()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const gen = () => Math.floor(10000 + Math.random() * 90000);
      let serial = null;
      for (let i = 0; i < 20; i++) {
        const cand = gen();
        // eslint-disable-next-line no-await-in-loop
        const exists = await MiscellaneousExpense.exists({ serialNumber: cand });
        if (!exists) { serial = cand; break; }
      }
      if (!serial) serial = gen();
      const payload = { ...req.body, serialNumber: serial };
      const created = await MiscellaneousExpense.create(payload);
      res.json(created);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List with optional filters: from, to, q (GivenTo / lineItem)
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
        { GivenTo: { $regex: String(q), $options: 'i' } },
        { lineItem: { $regex: String(q), $options: 'i' } },
      ];
    }
    const list = await MiscellaneousExpense.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get by id
router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await MiscellaneousExpense.findById(req.params.id);
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await MiscellaneousExpense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Pay miscellaneous expense (decrease amount, increase paidAmount)
router.post('/:id/pay', fetchAdmin, [body('amount').isNumeric()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const item = await MiscellaneousExpense.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    const pay = Math.max(0, Number(req.body.amount || 0));
    const curAmt = Number(item?.amount || 0);
    const curPaid = Number(item?.paidAmount || 0);
    const nextAmt = Math.max(0, curAmt - pay);
    const nextPaid = curPaid + Math.min(pay, curAmt);
    item.amount = nextAmt;
    item.paidAmount = nextPaid;
    await item.save();
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await MiscellaneousExpense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


