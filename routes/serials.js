const express = require('express');
const fetchAdmin = require('../middleware/fetchadmin');
const Events = require('../models/events');
const Flat = require('../models/flat');
const Employee = require('../models/employee');
const ElectricityBill = require('../models/electricityBill');
const Shop = require('../models/shop');
const MiscellaneousExpense = require('../models/miscellaneousExpense');

const router = express.Router();

const gen = () => Math.floor(10000 + Math.random() * 90000);

async function assignForModel(Model) {
  const existing = await Model.find({ serialNumber: { $ne: null } }, { serialNumber: 1 }).lean();
  const used = new Set(existing.map(d => d.serialNumber));
  const need = await Model.find({ $or: [{ serialNumber: { $exists: false } }, { serialNumber: null }] }, { _id: 1 }).lean();
  const ops = [];
  for (const d of need) {
    let serial = null;
    for (let i = 0; i < 20; i++) {
      const cand = gen();
      if (!used.has(cand)) { serial = cand; used.add(cand); break; }
    }
    if (!serial) serial = gen();
    ops.push({
      updateOne: {
        filter: { _id: d._id },
        update: { $set: { serialNumber: serial } }
      }
    });
  }
  if (ops.length) await Model.bulkWrite(ops);
  return { updated: ops.length, checked: need.length };
}

// Assign serial numbers to existing documents (optionally specify model)
// POST /api/serials/assign?model=events|flats|employees|electricity|shops|misc
router.post('/assign', async (req, res) => {
  try {
    const model = String(req.query.model || '').toLowerCase();
    const map = {
      events: Events,
      flats: Flat,
      employees: Employee,
      electricity: ElectricityBill,
      shops: Shop,
      misc: MiscellaneousExpense,
    };
    if (model && !map[model]) {
      return res.status(400).json({ message: 'Invalid model' });
    }
    const targets = model ? [[model, map[model]]] : Object.entries(map);
    const results = {};
    // run sequentially to avoid race on overlaps
    for (const [key, M] of targets) {
      // eslint-disable-next-line no-await-in-loop
      results[key] = await assignForModel(M);
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error('serials/assign error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


