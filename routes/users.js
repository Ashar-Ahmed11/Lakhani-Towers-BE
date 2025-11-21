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
    const CustomHeader = require('../models/customHeader');
    const CustomHeaderRecord = require('../models/customHeaderRecord');

    let user = await User.findById(req.params.id)
      .populate({ path: 'ownerOf.flat', select: 'flatNumber' })
      .populate({ path: 'tenantOf.flat', select: 'flatNumber' })
      .populate({ path: 'renterOf.flat', select: 'flatNumber' })
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
          .populate({ path: 'tenantOf.flat', select: 'flatNumber' })
          .populate({ path: 'renterOf.flat', select: 'flatNumber' })
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


