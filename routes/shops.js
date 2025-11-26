const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/shop');
const User = require('../models/user');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

const syncUserRelations = async (shop) => {
  try {
    // remove existing references for this shop
    await User.updateMany({ 'ownerOf.shop': shop._id }, { $pull: { ownerOf: { shop: shop._id } } });
    await User.updateMany({ 'tenantOf.shop': shop._id }, { $pull: { tenantOf: { shop: shop._id } } });
    await User.updateMany({ 'renterOf.shop': shop._id }, { $pull: { renterOf: { shop: shop._id } } });

    // add current owners
    for (const o of (shop.owners || [])) {
      if (!o.user) continue;
      await User.updateOne(
        { _id: o.user },
        { $push: { ownerOf: { shop: shop._id, owned: !!o.owned } } }
      );
    }
    // add current tenant
    for (const t of (shop.tenant || [])) {
      if (!t.user) continue;
      await User.updateOne(
        { _id: t.user },
        { $push: { tenantOf: { shop: shop._id, active: !!t.active } } }
      );
    }
    // add current renter
    for (const r of (shop.renter || [])) {
      if (!r.user) continue;
      await User.updateOne(
        { _id: r.user },
        { $push: { renterOf: { shop: shop._id, active: !!r.active } } }
      );
    }
  } catch (e) {
    console.error('User relation sync error (shop)', e.message);
  }
};

router.post('/', fetchAdmin, [body('shopNumber').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const created = await Shop.create(req.body);
    await syncUserRelations(created);
    res.json(created);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const list = await Shop.find()
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
    const item = await Shop.findById(req.params.id)
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
    const updated = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await syncUserRelations(updated);
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await Shop.findByIdAndDelete(id);
    // cleanup user relations
    await User.updateMany({ 'ownerOf.shop': id }, { $pull: { ownerOf: { shop: id } } });
    await User.updateMany({ 'tenantOf.shop': id }, { $pull: { tenantOf: { shop: id } } });
    await User.updateMany({ 'renterOf.shop': id }, { $pull: { renterOf: { shop: id } } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;





