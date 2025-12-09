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
      const item = await CustomHeaderRecord.create({
        header: req.body.header,
        purpose: req.body.purpose || '',
        fromUser: req.body.fromUser || null,
        fromVendorName: req.body.fromVendorName || '',
        fromVendorPhone: req.body.fromVendorPhone || '',
        fromAdmin: req.body.fromAdmin || null,
        toUser: req.body.toUser || null,
        toAdmin: req.body.toAdmin || null,
        subHeader: req.body.subHeader || null,
        month: req.body.month || [],
        documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
        amount: Number(req.body.amount || 0),
        dateOfAddition: req.body.dateOfAddition || new Date(),
        outstanding: req.body.outstanding ? {
          amount: Number(req.body.outstanding.amount || 0),
          status: req.body.outstanding.status === 'Paid' ? 'Paid' : 'Due',
          FromDate: req.body.outstanding.FromDate ? new Date(req.body.outstanding.FromDate) : new Date(),
          ToDate: req.body.outstanding.ToDate ? new Date(req.body.outstanding.ToDate) : new Date(),
        } : undefined
      });
      // link to flat arrays based on header type
      const header = await require('../models/customHeader').findById(req.body.header);
      if (header?.headerType === 'Incoming' && req.body.fromUser) {
        await require('../models/flat').updateOne({ _id: req.body.fromUser }, { $addToSet: { incomingRecords: item._id } });
      }
      if (header?.headerType === 'Expense' && req.body.toUser) {
        await require('../models/flat').updateOne({ _id: req.body.toUser }, { $addToSet: { expenseRecords: item._id } });
      }
      res.json(item);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { from, to, headerType, recurring, status } = req.query;
    const query = {};
    if (from || to) {
      query.dateOfAddition = {};
      if (from) query.dateOfAddition.$gte = new Date(from);
      if (to) {
        const dt = new Date(from ? to : Date.now());
        if (to) {
          dt.setHours(23, 59, 59, 999);
          query.dateOfAddition.$lte = dt;
        }
      }
    }
    let headerFilter = {};
    if (headerType || typeof recurring !== 'undefined') {
      const CustomHeader = require('../models/customHeader');
      const hdrQuery = {};
      if (headerType) hdrQuery.headerType = headerType;
      if (typeof recurring !== 'undefined') hdrQuery.recurring = String(recurring) === 'true';
      const headers = await CustomHeader.find(hdrQuery).select('_id');
      headerFilter = { header: { $in: headers.map(h => h._id) } };
    }
    const baseList = await CustomHeaderRecord.find({ ...query, ...headerFilter })
      .sort({ createdAt: -1 })
      .populate({ path: 'header' })
      .populate({ path: 'subHeader' })
      .populate({ path: 'fromUser' })
      .populate({ path: 'toUser' })
      .populate({ path: 'fromAdmin', select: 'username email' })
      .populate({ path: 'toAdmin', select: 'username email' });
    let list = baseList;
    if (status) {
      const norm = String(status).toLowerCase();
      list = baseList.filter(r => {
        const months = Array.isArray(r.month) ? r.month : [];
        if (months.length === 0) return false;
        const hasDue = months.some(m => m?.status === 'Due');
        const allPaid = months.every(m => m?.status === 'Paid');
        const eff = hasDue ? 'due' : (allPaid ? 'paid' : 'pending');
        return eff === norm;
      });
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await CustomHeaderRecord.findById(req.params.id)
      .populate({ path: 'header' })
      .populate({ path: 'subHeader' })
      .populate({ path: 'fromUser' })
      .populate({ path: 'toUser' })
      .populate({ path: 'fromAdmin', select: 'username email' })
      .populate({ path: 'toAdmin', select: 'username email' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public route to fetch a record without auth (for PDF rendering)
router.get('/public/:id', async (req, res) => {
  try {
    const item = await CustomHeaderRecord.findById(req.params.id)
      .populate({ path: 'header' })
      .populate({ path: 'fromUser' })
      .populate({ path: 'toUser' })
      .populate({ path: 'fromAdmin', select: 'username email' })
      .populate({ path: 'toAdmin', select: 'username email' });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const payload = {
      ...req.body,
    };
    if (req.body.purpose !== undefined) payload.purpose = req.body.purpose;
    if (req.body.fromVendorName !== undefined) payload.fromVendorName = req.body.fromVendorName;
    if (req.body.fromVendorPhone !== undefined) payload.fromVendorPhone = req.body.fromVendorPhone;
    if (req.body.subHeader !== undefined) payload.subHeader = req.body.subHeader || null;
    if (req.body.outstanding !== undefined) {
      payload.outstanding = {
        amount: Number(req.body.outstanding.amount || 0),
        status: req.body.outstanding.status === 'Paid' ? 'Paid' : 'Due',
        FromDate: req.body.outstanding.FromDate ? new Date(req.body.outstanding.FromDate) : new Date(),
        ToDate: req.body.outstanding.ToDate ? new Date(req.body.outstanding.ToDate) : new Date(),
      };
    }
    const updated = await CustomHeaderRecord.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    const rec = await CustomHeaderRecord.findById(req.params.id);
    await CustomHeaderRecord.findByIdAndDelete(req.params.id);
    if (rec) {
      const header = await require('../models/customHeader').findById(rec.header);
      if (header?.headerType === 'Incoming' && rec.fromUser) {
        await require('../models/flat').updateOne({ _id: rec.fromUser }, { $pull: { incomingRecords: rec._id } });
      }
      if (header?.headerType === 'Expense' && rec.toUser) {
        await require('../models/flat').updateOne({ _id: rec.toUser }, { $pull: { expenseRecords: rec._id } });
      }
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


