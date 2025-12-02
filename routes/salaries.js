const express = require('express');
const { body, validationResult } = require('express-validator');
const Salary = require('../models/salary');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post(
  '/',
  fetchAdmin,
  [body('employee').notEmpty(), body('amount').isNumeric()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await Salary.create(req.body);
      // Link salary to employee document
      const Employee = require('../models/employee');
      await Employee.updateOne({ _id: req.body.employee }, { $addToSet: { employeeSalaryRecords: item._id } });
      res.json(item);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { from, to, status, employeeId } = req.query;
    const query = {};
    if (employeeId) query.employee = employeeId;
    if (from || to) {
      query.dateOfCreation = {};
      if (from) query.dateOfCreation.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23,59,59,999);
        query.dateOfCreation.$lte = dt;
      }
    }
    const base = await Salary.find(query).sort({ createdAt: -1 }).populate('employee');
    let list = base;
    if (status) {
      const norm = String(status).toLowerCase();
      list = base.filter((e) => {
        const months = Array.isArray(e.month) ? e.month : [];
        if (months.length === 0) return false;
        const hasDue = months.some(m => m?.status === 'Due');
        const allPaid = months.every(m => m?.status === 'Paid');
        const eff = hasDue ? 'due' : (allPaid ? 'paid' : 'pending');
        return eff === norm;
      });
    }
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Salary.findById(req.params.id).populate('employee');
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public salary record for PDF
router.get('/public/:id', async (req, res) => {
  try {
    const item = await Salary.findById(req.params.id).populate('employee');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    await Salary.findByIdAndDelete(req.params.id);
    if (salary?.employee) {
      const Employee = require('../models/employee');
      await Employee.updateOne({ _id: salary.employee }, { $pull: { employeeSalaryRecords: salary._id } });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


