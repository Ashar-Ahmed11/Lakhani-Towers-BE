const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

// Create
router.post(
  '/',
  fetchAdmin,
  [body('userName').notEmpty(), body('userMobile').isNumeric()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = await User.create(req.body);
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Read all
router.get('/', fetchAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Read one
router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const Maintenance = require('../models/maintenance');
    const ShopMaintenance = require('../models/shopMaintenance');
    const Loan = require('../models/loan');
    const CustomHeader = require('../models/customHeader');
    const CustomHeaderRecord = require('../models/customHeaderRecord');

    let user = await User.findById(req.params.id)
      .populate({ path: 'ownerOf.flat', select: 'flatNumber' })
      .populate({ path: 'ownerOf.shop', select: 'shopNumber' })
      .populate({ path: 'tenantOf.flat', select: 'flatNumber' })
      .populate({ path: 'tenantOf.shop', select: 'shopNumber' })
      .populate({ path: 'renterOf.flat', select: 'flatNumber' })
      .populate({ path: 'renterOf.shop', select: 'shopNumber' })
      .populate({ path: 'incomingRecords', select: 'amount dateOfAddition header purpose month', populate: { path: 'header', select: 'headerName headerType' } })
      .populate({ path: 'expenseRecords', select: 'amount dateOfAddition header purpose month', populate: { path: 'header', select: 'headerName headerType' } });

    const missing = (user?.incomingRecords || []).filter(r => !r.header);
    if (missing.length > 0) {
      const maintHeader = await CustomHeader.findOne({
        headerType: 'Incoming',
        $or: [{ headerName: /maintenance/i }, { headerName: /maintanance/i }]
      });
      if (maintHeader) {
        for (const rec of missing) {
          const m = await Maintenance.findOne({ recordRef: rec._id });
          if (m) {
            await CustomHeaderRecord.updateOne({ _id: rec._id }, { $set: { header: maintHeader._id } });
          }
        }
        user = await User.findById(req.params.id)
          .populate({ path: 'ownerOf.flat', select: 'flatNumber' })
          .populate({ path: 'ownerOf.shop', select: 'shopNumber' })
          .populate({ path: 'tenantOf.flat', select: 'flatNumber' })
          .populate({ path: 'tenantOf.shop', select: 'shopNumber' })
          .populate({ path: 'renterOf.flat', select: 'flatNumber' })
          .populate({ path: 'renterOf.shop', select: 'shopNumber' })
          .populate({ path: 'incomingRecords', select: 'amount dateOfAddition header purpose month', populate: { path: 'header', select: 'headerName headerType' } })
          .populate({ path: 'expenseRecords', select: 'amount dateOfAddition header purpose month', populate: { path: 'header', select: 'headerName headerType' } });
      }
    }

    // Attach maintenanceId to incoming records for edit routing
    const out = user.toObject();
    // const Maintenance = require('../models/maintenance');
    const recIds = (out.incomingRecords || []).map(r => r._id);
    if (recIds.length) {
      const maints = await Maintenance.find({ recordRef: { $in: recIds } }, { _id: 1, recordRef: 1 });
      const mapId = new Map(maints.map(m => [String(m.recordRef), String(m._id)]));
      out.incomingRecords = out.incomingRecords.map(r => ({ ...r, maintenanceId: mapId.get(String(r._id)) }));
    }
    // Append Maintenance records (Incoming) for this user if not already linked via CustomHeaderRecord
    const directMaints = await Maintenance.find({ from: req.params.id }, { _id: 1, maintenancePurpose: 1, maintenanceAmount: 1, month: 1, createdAt: 1, recordRef: 1 });
    const existingRecIds = new Set((out.incomingRecords || []).map(r => String(r._id)));
    const maintAsIncoming = (directMaints || []).filter(m => !m.recordRef || !existingRecIds.has(String(m.recordRef))).map(m => ({
      _id: m._id,
      purpose: m.maintenancePurpose,
      amount: Number(m.maintenanceAmount || 0),
      month: m.month || [],
      dateOfAddition: m.createdAt,
      header: { headerName: 'Maintanance', headerType: 'Incoming' },
      maintenanceId: m._id,
    }));
    out.incomingRecords = [...(out.incomingRecords || []), ...maintAsIncoming];
    // Append Shop Maintenance records (Incoming) for this user
    const shopMaints = await ShopMaintenance.find({ from: req.params.id }, { _id: 1, maintenancePurpose: 1, maintenanceAmount: 1, month: 1, createdAt: 1 });
    const shopMaintAsIncoming = shopMaints.map(sm => ({
      _id: sm._id,
      purpose: sm.maintenancePurpose,
      amount: Number(sm.maintenanceAmount || 0),
      month: sm.month || [],
      dateOfAddition: sm.createdAt,
      header: { headerName: 'Shop Maintenance', headerType: 'Incoming' },
      shopMaintenanceId: sm._id,
    }));
    out.incomingRecords = [...(out.incomingRecords || []), ...shopMaintAsIncoming]
      .sort((a, b) => new Date(b.dateOfAddition || b.createdAt || 0) - new Date(a.dateOfAddition || a.createdAt || 0));
    // Append Loan records (Incoming) where this user is the 'to'
    const loans = await Loan.find({ to: req.params.id }, { _id: 1, purpose: 1, amount: 1, status: 1, date: 1, createdAt: 1 });
    const loanAsIncoming = loans.map(l => ({
      _id: l._id,
      purpose: l.purpose,
      amount: Number(l.amount || 0),
      month: [], // non-recurring
      dateOfAddition: l.date || l.createdAt,
      header: { headerName: 'Loan', headerType: 'Incoming' },
      loanId: l._id,
      loanStatus: l.status,
    }));
    out.incomingRecords = [...(out.incomingRecords || []), ...loanAsIncoming]
      .sort((a, b) => new Date(b.dateOfAddition || b.createdAt || 0) - new Date(a.dateOfAddition || a.createdAt || 0));
    res.json(out);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


