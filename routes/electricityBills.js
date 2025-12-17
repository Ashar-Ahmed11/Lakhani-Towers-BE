const express = require('express');
const { body, validationResult } = require('express-validator');
const ElectricityBill = require('../models/electricityBill');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

// Create
router.post(
  '/',
  fetchAdmin,
  [body('consumerNumber').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const created = await ElectricityBill.create(req.body);
      res.json(created);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List with optional filters: from, to, q (consumerNumber)
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
      // search by consumerNumber partial
      query.consumerNumber = { $regex: String(q), $options: 'i' };
    }
    const list = await ElectricityBill.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get by id
router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await ElectricityBill.findById(req.params.id);
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await ElectricityBill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Pay electricity bill (decrease monthlyPayables.amount, increase paidAmount)
router.post('/:id/pay', fetchAdmin, [body('amount').isNumeric()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const bill = await ElectricityBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Not found' });
    const pay = Math.max(0, Number(req.body.amount || 0));
    const curMonthly = Number(bill?.BillRecord?.monthlyPayables?.amount || 0);
    const curPaid = Number(bill?.BillRecord?.paidAmount || 0);
    const nextMonthly = Math.max(0, curMonthly - pay);
    const nextPaid = curPaid + Math.min(pay, curMonthly);
    bill.BillRecord = {
      ...(bill.BillRecord || {}),
      monthlyPayables: { amount: nextMonthly },
      paidAmount: nextPaid,
    };
    await bill.save();
    res.json(bill);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await ElectricityBill.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


