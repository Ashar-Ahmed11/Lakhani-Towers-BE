const express = require('express');
const { body, validationResult } = require('express-validator');
const Maintenance = require('../models/maintenance');
const CustomHeader = require('../models/customHeader');
const CustomHeaderRecord = require('../models/customHeaderRecord');
const User = require('../models/user');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post(
  '/',
  fetchAdmin,
  [body('maintenancePurpose').notEmpty(), body('maintenanceAmount').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await Maintenance.create({
        maintenancePurpose: req.body.maintenancePurpose,
        maintenanceAmount: req.body.maintenanceAmount,
        documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
        month: (req.body.month || []).map(m => ({
          status: m.status, amount: Number(m.amount || 0), occuranceDate: m.occuranceDate || new Date()
        })),
        flat: req.body.flat || null,
        from: req.body.from || null,
        to: req.body.to || null,
      });
      // link with pre-existing 'Maintenance' header only (do not create dynamically)
      // Try to find existing prebuilt Maintenance header (handle common spellings)
      let header = await CustomHeader.findOne({
        headerType: 'Incoming',
        $or: [
          { headerName: /maintenance/i },
          { headerName: /maintanance/i }
        ]
      });
      if (header) {
        const record = await CustomHeaderRecord.create({
          header: header._id,
          purpose: req.body.maintenancePurpose || '',
          fromUser: req.body.from || null,
          toAdmin: req.body.to || null,
          amount: Number(req.body.maintenanceAmount || 0),
          dateOfAddition: new Date(),
          documentImages: (req.body.documentImages || []).map(d => ({ url: d.url }))
        });
        item.recordRef = record._id;
        await item.save();
        if (req.body.from) {
          await User.updateOne({ _id: req.body.from }, { $addToSet: { incomingRecords: record._id } });
        }
      }
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
    let list = await Maintenance.find(query).sort({ createdAt: -1 }).populate({ path: 'flat', select: 'flatNumber' }).populate({ path: 'from', select: 'userName userMobile' });
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
    const item = await Maintenance.findById(req.params.id).populate({ path: 'flat', select: 'flatNumber' }).populate({ path: 'from', select: 'userName userMobile' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public maintenance record for PDF
router.get('/public/:id', async (req, res) => {
  try {
    const item = await Maintenance.findById(req.params.id).populate({ path: 'flat', select: 'flatNumber' }).populate({ path: 'from', select: 'userName userMobile' });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const payload = {
      maintenancePurpose: req.body.maintenancePurpose,
      maintenanceAmount: req.body.maintenanceAmount,
      documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
      flat: req.body.flat || null,
      from: req.body.from || null,
      to: req.body.to || null,
    };
    if (Array.isArray(req.body.month)) {
      payload.month = req.body.month.map(m => ({
        status: m.status, amount: Number(m.amount || 0), occuranceDate: m.occuranceDate || new Date()
      }));
    }
    const updated = await Maintenance.findByIdAndUpdate(req.params.id, payload, { new: true });
    // sync linked record if exists
    if (updated.recordRef) {
      await CustomHeaderRecord.findByIdAndUpdate(updated.recordRef, {
        amount: Number(req.body.maintenanceAmount || 0),
        documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
        fromUser: req.body.from || null,
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
      if (m.from) await User.updateOne({ _id: m.from }, { $pull: { incomingRecords: m.recordRef } });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


