const express = require('express');
const { body, validationResult } = require('express-validator');
const Maintenance = require('../models/maintenance');
const CustomHeaderRecord = require('../models/customHeaderRecord');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post(
  '/',
  fetchAdmin,
  [body('maintenanceAmount').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await Maintenance.create({
        maintenanceAmount: req.body.maintenanceAmount,
        documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
        month: (req.body.month || []).map(m => ({
          status: m.status,
          amount: Number(m.amount || 0),
          occuranceDate: m.occuranceDate || new Date(),
          paidAmount: Number(m.paidAmount || (m.status === 'Paid' ? Number(m.amount || 0) : 0)),
        })),
        flat: req.body.flat || null,
        to: req.body.to || null,
        outstanding: req.body.outstanding ? {
          amount: Number(req.body.outstanding.amount || 0),
          status: req.body.outstanding.status === 'Paid' ? 'Paid' : 'Due',
          FromDate: req.body.outstanding.FromDate ? new Date(req.body.outstanding.FromDate) : new Date(),
          ToDate: req.body.outstanding.ToDate ? new Date(req.body.outstanding.ToDate) : new Date(),
        } : undefined,
      });
      // Do NOT create a dynamic Custom Header/Record for 'Maintanance'.
      // Linking to user's incoming records is handled in users route (appends maintenance without duplicates).
      res.json(item);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const query = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(from ? to : Date.now());
        if (to) {
          dt.setHours(23, 59, 59, 999);
          query.createdAt.$lte = dt;
        }
      }
    }
    let list = await Maintenance.find(query).sort({ createdAt: -1 }).populate({ path: 'flat' });
    if (status) {
      list = (list || []).filter(r => {
        const months = r.month || [];
        if (!Array.isArray(months) || months.length === 0) return status === 'Pending';
        const hasDue = months.some(m => m?.status === 'Due');
        if (hasDue) return status === 'Due';
        const allPaid = months.every(m => m?.status === 'Paid');
        return allPaid ? status === 'Paid' : status === 'Pending';
      });
    }
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Maintenance.findById(req.params.id).populate({ path: 'flat' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public maintenance record for PDF
router.get('/public/:id', async (req, res) => {
  try {
    const item = await Maintenance.findById(req.params.id).populate({ path: 'flat' });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const payload = {
      maintenanceAmount: req.body.maintenanceAmount,
      documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
      flat: req.body.flat || null,
      to: req.body.to || null,
    };
    if (req.body.outstanding) {
      payload.outstanding = {
        amount: Number(req.body.outstanding.amount || 0),
        status: req.body.outstanding.status === 'Paid' ? 'Paid' : 'Due',
        FromDate: req.body.outstanding.FromDate ? new Date(req.body.outstanding.FromDate) : new Date(),
        ToDate: req.body.outstanding.ToDate ? new Date(req.body.outstanding.ToDate) : new Date(),
      };
    }
    if (Array.isArray(req.body.month)) {
      payload.month = req.body.month.map(m => ({
        status: m.status,
        amount: Number(m.amount || 0),
        occuranceDate: m.occuranceDate || new Date(),
        paidAmount: Number(m.paidAmount || (m.status === 'Paid' ? Number(m.amount || 0) : 0)),
      }));
    }
    const updated = await Maintenance.findByIdAndUpdate(req.params.id, payload, { new: true });
    // sync linked record if exists
    if (updated.recordRef) {
      await CustomHeaderRecord.findByIdAndUpdate(updated.recordRef, {
        amount: Number(req.body.maintenanceAmount || 0),
        documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
        fromUser: req.body.flat || null,
        toAdmin: req.body.to || null,
      });
    }
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    const m = await Maintenance.findById(req.params.id);
    await Maintenance.findByIdAndDelete(req.params.id);
    if (m?.recordRef) {
      await CustomHeaderRecord.findByIdAndDelete(m.recordRef);
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


