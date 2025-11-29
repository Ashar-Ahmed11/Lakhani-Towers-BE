const express = require('express');
const CustomHeader = require('../models/customHeader');
const CustomHeaderRecord = require('../models/customHeaderRecord');
const Maintenance = require('../models/maintenance');
const ShopMaintenance = require('../models/shopMaintenance');
const Salary = require('../models/salary');

const router = express.Router();

const getNextMonthFirst = (baseDate = new Date()) => {
  const y = baseDate.getUTCFullYear();
  const m = baseDate.getUTCMonth(); // 0-based
  return new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0)); // 1st of next month at 00:00 UTC
};

const sameMonthYear = (a, b) => a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();

router.post('/due-months', async (req, res) => {
  try {
    const nextMonthFirst = getNextMonthFirst(new Date());

    const processMaintenance = async () => {
      const docs = await Maintenance.find({}, { _id: 1, month: 1, maintenanceAmount: 1 }).lean();
      const ops = [];
      let matched = 0, added = 0;
      for (const d of (docs || [])) {
        if (!Array.isArray(d.month)) continue;
        matched++;
        const updated = (d.month || []).map(m => {
          const dt = new Date(m.occuranceDate);
          if (sameMonthYear(dt, nextMonthFirst)) return m; // keep next-month entry as-is
          return { ...m, status: m.status === 'Pending' ? 'Due' : m.status };
        });
        const existsNext = (d.month || []).some(m => sameMonthYear(new Date(m.occuranceDate), nextMonthFirst));
        if (!existsNext) {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: {
                $set: { month: [...updated, { status: 'Pending', amount: Number(d.maintenanceAmount || 0), occuranceDate: nextMonthFirst }] }
              }
            }
          });
          added++;
        } else {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: { $set: { month: updated } }
            }
          });
        }
      }
      if (ops.length) await Maintenance.bulkWrite(ops);
      return { matched, modified: ops.length, added };
    };

    const processShopMaintenance = async () => {
      const docs = await ShopMaintenance.find({}, { _id: 1, month: 1, maintenanceAmount: 1 }).lean();
      const ops = [];
      let matched = 0, added = 0;
      for (const d of (docs || [])) {
        if (!Array.isArray(d.month)) continue;
        matched++;
        const updated = (d.month || []).map(m => {
          const dt = new Date(m.occuranceDate);
          if (sameMonthYear(dt, nextMonthFirst)) return m;
          return { ...m, status: m.status === 'Pending' ? 'Due' : m.status };
        });
        const existsNext = (d.month || []).some(m => sameMonthYear(new Date(m.occuranceDate), nextMonthFirst));
        if (!existsNext) {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: {
                $set: { month: [...updated, { status: 'Pending', amount: Number(d.maintenanceAmount || 0), occuranceDate: nextMonthFirst }] }
              }
            }
          });
          added++;
        } else {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: { $set: { month: updated } }
            }
          });
        }
      }
      if (ops.length) await ShopMaintenance.bulkWrite(ops);
      return { matched, modified: ops.length, added };
    };

    const processSalaries = async () => {
      const docs = await Salary.find({}, { _id: 1, month: 1, amount: 1 }).lean();
      const ops = [];
      let matched = 0, added = 0;
      for (const d of (docs || [])) {
        if (!Array.isArray(d.month)) continue;
        matched++;
        const updated = (d.month || []).map(m => {
          const dt = new Date(m.occuranceDate);
          if (sameMonthYear(dt, nextMonthFirst)) return m;
          return { ...m, status: m.status === 'Pending' ? 'Due' : m.status };
        });
        const existsNext = (d.month || []).some(m => sameMonthYear(new Date(m.occuranceDate), nextMonthFirst));
        if (!existsNext) {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: {
                $set: { month: [...updated, { status: 'Pending', amount: Number(d.amount || 0), occuranceDate: nextMonthFirst }] }
              }
            }
          });
          added++;
        } else {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: { $set: { month: updated } }
            }
          });
        }
      }
      if (ops.length) await Salary.bulkWrite(ops);
      return { matched, modified: ops.length, added };
    };

    const processCustomHeaderRecords = async () => {
      const headers = await CustomHeader.find({ recurring: true }, { _id: 1 }).lean();
      const headerIds = headers.map(h => h._id);
      if (headerIds.length === 0) return { matched: 0, modified: 0, added: 0 };
      const docs = await CustomHeaderRecord.find(
        { header: { $in: headerIds } },
        { _id: 1, month: 1, amount: 1 }
      ).lean();
      const ops = [];
      let matched = 0, added = 0;
      for (const d of (docs || [])) {
        if (!Array.isArray(d.month)) continue;
        matched++;
        const updated = (d.month || []).map(m => {
          const dt = new Date(m.occuranceDate);
          if (sameMonthYear(dt, nextMonthFirst)) return m;
          return { ...m, status: m.status === 'Pending' ? 'Due' : m.status };
        });
        const existsNext = (d.month || []).some(m => sameMonthYear(new Date(m.occuranceDate), nextMonthFirst));
        if (!existsNext) {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: {
                $set: { month: [...updated, { status: 'Pending', amount: Number(d.amount || 0), occuranceDate: nextMonthFirst }] }
              }
            }
          });
          added++;
        } else {
          ops.push({
            updateOne: {
              filter: { _id: d._id },
              update: { $set: { month: updated } }
            }
          });
        }
      }
      if (ops.length) await CustomHeaderRecord.bulkWrite(ops);
      return { matched, modified: ops.length, added };
    };

    const [m, sm, s, chr] = await Promise.all([
      processMaintenance(),
      processShopMaintenance(),
      processSalaries(),
      processCustomHeaderRecords()
    ]);

    res.json({
      success: true,
      maintenance: m,
      shopMaintenance: sm,
      salaries: s,
      customHeaderRecords: chr
    });
  } catch (err) {
    console.error('auto/due-months error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


