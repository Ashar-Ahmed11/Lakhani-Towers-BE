const express = require('express');
const { body, validationResult } = require('express-validator');
const Flat = require('../models/flat');
const User = require('../models/user');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

const syncUserRelations = async (flat) => {
  try {
    // remove existing references for this flat
    await User.updateMany({ 'ownerOf.flat': flat._id }, { $pull: { ownerOf: { flat: flat._id } } });
    await User.updateMany({ 'tenantOf.flat': flat._id }, { $pull: { tenantOf: { flat: flat._id } } });
    await User.updateMany({ 'renterOf.flat': flat._id }, { $pull: { renterOf: { flat: flat._id } } });

    // add current owners
    for (const o of (flat.owners || [])) {
      if (!o.user) continue;
      await User.updateOne(
        { _id: o.user },
        { $push: { ownerOf: { flat: flat._id, owned: !!o.owned } } }
      );
    }
    // add current tenant
    for (const t of (flat.tenant || [])) {
      if (!t.user) continue;
      await User.updateOne(
        { _id: t.user },
        { $push: { tenantOf: { flat: flat._id, active: !!t.active } } }
      );
    }
    // add current renter
    for (const r of (flat.renter || [])) {
      if (!r.user) continue;
      await User.updateOne(
        { _id: r.user },
        { $push: { renterOf: { flat: flat._id, active: !!r.active } } }
      );
    }
  } catch (e) {
    console.error('User relation sync error', e.message);
  }
};

router.post('/', fetchAdmin, [body('flatNumber').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const flat = await Flat.create(req.body);
    await syncUserRelations(flat);
    res.json(flat);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await Flat.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'owners.user', select: 'userName userMobile' })
      .populate({ path: 'tenant.user', select: 'userName userMobile' })
      .populate({ path: 'renter.user', select: 'userName userMobile' });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Flat.findById(req.params.id)
      .populate({ path: 'owners.user', select: 'userName userMobile' })
      .populate({ path: 'tenant.user', select: 'userName userMobile' })
      .populate({ path: 'renter.user', select: 'userName userMobile' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', fetchAdmin, async (req, res) => {
  try {
    const updated = await Flat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await syncUserRelations(updated);
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await Flat.findByIdAndDelete(id);
    // cleanup user relations
    await User.updateMany({ 'ownerOf.flat': id }, { $pull: { ownerOf: { flat: id } } });
    await User.updateMany({ 'tenantOf.flat': id }, { $pull: { tenantOf: { flat: id } } });
    await User.updateMany({ 'renterOf.flat': id }, { $pull: { renterOf: { flat: id } } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


