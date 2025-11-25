const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Manager = require('../models/manager');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();
const JWT_SECRET = 'ashar.2day@karachi';

// Create (Register) Admin
router.post(
  '/register',
  [
    body('username', 'Username is required').trim().notEmpty(),
    body('email', 'Valid email is required').isEmail(),
    body('password', 'Min 6 chars password required').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { username, email, password } = req.body;
      const existing = await Admin.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ message: 'Admin already exists' });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const admin = await Admin.create({ username, email: email.toLowerCase(), password: hash });
      const authToken = jwt.sign({ user: admin._id }, JWT_SECRET);
      res.json({ authToken, admin: { _id: admin._id, username: admin.username, email: admin.email } });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login (supports Admin and Manager)
router.post(
  '/login',
  [body('email', 'Valid email is required').isEmail(), body('password', 'Password is required').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, password } = req.body;
      const lower = email.toLowerCase();

      // Try Admin first
      const admin = await Admin.findOne({ email: lower });
      if (admin) {
        const pass = await bcrypt.compare(password, admin.password);
        if (!pass) return res.status(404).json({ message: 'Invalid credentials' });
        const authToken = jwt.sign({ user: admin._id, entityType: 'admin' }, JWT_SECRET);
        return res.json({ authToken, user: { _id: admin._id, role: 'admin', username: admin.username, email: admin.email } });
      }

      // Then try Manager
      const manager = await Manager.findOne({ email: lower });
      if (!manager) return res.status(404).json({ message: 'Invalid credentials' });
      const pass = await bcrypt.compare(password, manager.password);
      if (!pass) return res.status(404).json({ message: 'Invalid credentials' });
      const authToken = jwt.sign({ user: manager._id, entityType: 'manager' }, JWT_SECRET);
      return res.json({
        authToken,
        user: {
          _id: manager._id,
          role: 'manager',
          email: manager.email,
          fullName: manager.fullName,
          payOnlyShopMaintenance: manager.payOnlyShopMaintenance,
          changeAllAmounts: manager.changeAllAmounts,
          payAllAmounts: manager.payAllAmounts,
          salariesDistribution: manager.salariesDistribution,
          lumpSumAmounts: manager.lumpSumAmounts,
          editRole: manager.editRole,
        }
      });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get current authenticated entity (admin or manager)
router.get('/me', fetchAdmin, async (req, res) => {
  try {
    if (req.entityType === 'manager') {
      const m = await Manager.findById(req.user).select('-password');
      return res.json(m);
    }
    const a = await Admin.findById(req.user).select('-password');
    res.json(a);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin
router.put(
  '/:id',
  fetchAdmin,
  [body('email').optional().isEmail(), body('password').optional().isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const updates = { ...req.body };
      if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
      }
      const updated = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
      res.json(updated);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete admin
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


