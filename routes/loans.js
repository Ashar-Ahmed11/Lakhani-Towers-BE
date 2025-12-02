const express = require('express');
const { body, validationResult } = require('express-validator');
const Loan = require('../models/loan');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post('/', fetchAdmin, [
  body('to').notEmpty(),
  body('purpose').notEmpty(),
  body('amount').isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const payload = { ...req.body, to: req.body?.to?._id || req.body?.to };
    const created = await Loan.create(payload);
    const populated = await Loan.findById(created._id).populate({ path: 'to', select: 'employeeName employeePhone' });
    res.json(populated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { from, to, status, q, toId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (toId) query.to = toId;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23,59,59,999);
        query.date.$lte = dt;
      }
    }
    if (q) {
      const n = Number(q);
      if (Number.isFinite(n)) query.amount = n;
      else query.purpose = { $regex: q, $options: 'i' };
    }
    const list = await Loan.find(query).sort({ createdAt: -1 }).populate({ path: 'to', select: 'employeeName employeePhone' });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate({ path: 'to', select: 'employeeName employeePhone' });
    res.json(loan);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const payload = { ...req.body, to: req.body?.to?._id || req.body?.to };
    await Loan.findByIdAndUpdate(req.params.id, payload, { new: true });
    const populated = await Loan.findById(req.params.id).populate({ path: 'to', select: 'employeeName employeePhone' });
    res.json(populated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Loan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;





