const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const fetchAdmin = require('../middleware/fetchadmin');
const Manager = require('../models/manager');

const router = express.Router();

// Ensure only real admin can manage managers
const requireAdmin = (req, res, next) => {
  if (req.entityType !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

// List
router.get('/', fetchAdmin, requireAdmin, async (req, res) => {
  const list = await Manager.find().select('-password').sort({ createdAt: -1 });
  res.json(list);
});

// Get by id
router.get('/:id', fetchAdmin, requireAdmin, async (req, res) => {
  const m = await Manager.findById(req.params.id).select('-password');
  if (!m) return res.status(404).json({ message: 'Not found' });
  res.json(m);
});

// Create
router.post(
  '/',
  fetchAdmin,
  requireAdmin,
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const {
      email, password, fullName, role,
      payOnlyShopMaintenance, changeAllAmounts, payAllAmounts,
      salariesDistribution, lumpSumAmounts, editRole
    } = req.body;
    const exists = await Manager.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const m = await Manager.create({
      email: email.toLowerCase(),
      password: hash,
      fullName,
      role: role || 'manager',
      payOnlyShopMaintenance: !!payOnlyShopMaintenance,
      changeAllAmounts: !!changeAllAmounts,
      payAllAmounts: !!payAllAmounts,
      salariesDistribution: !!salariesDistribution,
      lumpSumAmounts: !!lumpSumAmounts,
      editRole: typeof editRole === 'boolean' ? editRole : true,
    });
    res.json({ _id: m._id });
  }
);

// Update
router.put('/:id', fetchAdmin, requireAdmin, async (req, res) => {
  const updates = { ...req.body };
  if (updates.email) updates.email = updates.email.toLowerCase();
  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(updates.password, salt);
  } else {
    delete updates.password;
  }
  const m = await Manager.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  res.json(m);
});

// Delete
router.delete('/:id', fetchAdmin, requireAdmin, async (req, res) => {
  await Manager.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;



