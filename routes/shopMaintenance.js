const express = require('express');
const { body, validationResult } = require('express-validator');
const ShopMaintenance = require('../models/shopMaintenance');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

router.post('/', fetchAdmin, [body('maintenanceAmount').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const item = await ShopMaintenance.create({
      maintenanceAmount: req.body.maintenanceAmount,
      documentImages: (req.body.documentImages || []).map(d => ({ url: d.url })),
      month: (req.body.month || []).map(m => ({
        status: m.status,
        amount: Number(m.amount || 0),
        occuranceDate: m.occuranceDate || new Date(),
        paidAmount: Number(m.paidAmount || (m.status === 'Paid' ? Number(m.amount || 0) : 0)),
      })),
      shop: req.body.shop || null,
      to: req.body.to || null,
    });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { from, to, status, q } = req.query;
    const query = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const dt = new Date(to);
        dt.setHours(23,59,59,999);
        query.createdAt.$lte = dt;
      }
    }
    let list = await ShopMaintenance.find(query).sort({ createdAt: -1 }).populate({ path: 'shop' });
    if (q) {
      const lower = String(q||'').toLowerCase();
      list = list.filter(x => {
        const s = x.shop || {};
        const owner = s.owner || {};
        const tenant = s.tenant || {};
        return String(s.shopNumber||'').toLowerCase().includes(lower) ||
               String(owner.userName||'').toLowerCase().includes(lower) ||
               String(owner.userMobile||'').includes(lower) ||
               String(tenant.userName||'').toLowerCase().includes(lower) ||
               String(tenant.userMobile||'').includes(lower);
      });
    }
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
    const item = await ShopMaintenance.findById(req.params.id).populate({ path: 'shop' });
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
      shop: req.body.shop || null,
      to: req.body.to || null,
    };
    if (Array.isArray(req.body.month)) {
      payload.month = req.body.month.map(m => ({
        status: m.status,
        amount: Number(m.amount || 0),
        occuranceDate: m.occuranceDate || new Date(),
        paidAmount: Number(m.paidAmount || (m.status === 'Paid' ? Number(m.amount || 0) : 0)),
      }));
    }
    const updated = await ShopMaintenance.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await ShopMaintenance.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



