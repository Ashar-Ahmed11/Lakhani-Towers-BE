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

// Monthly rollover for Flats, Shops, Employees, and Electricity Bills
router.post('/monthly-rollover', async (req, res) => {
  try {
    const now = new Date();
    // Timezone-aware first-of-month check (configurable). Defaults to UTC; set ROLL_TZ_OFFSET_MINUTES=300 for PKT (UTC+5).
    const tzOffsetMinutes = Number(process.env.ROLL_TZ_OFFSET_MINUTES || 0); // e.g., 300 for PKT
    const localNow = new Date(now.getTime() + tzOffsetMinutes * 60 * 1000);
    const isFirstDayOfMonth = localNow.getUTCDate() === 1;
    // Allow forcing monthly sections via query for testing (e.g. ?forceMonthly=true)
    const forceMonthly = String(req.query.forceMonthly || '').toLowerCase() === 'true' || String(req.query.force || '').toLowerCase() === 'true';
    const runMonthlySections = isFirstDayOfMonth || !!forceMonthly;

    // Lazily import to avoid circulars
    const Flat = require('../models/flat');
    const Shop = require('../models/shop');
    const Salary = require('../models/salary');
    const ElectricityBill = require('../models/electricityBill');

    // Helpers
    const addOrConsume = (monthlyAmount, advanceAmount, currentOutAmount) => {
      const m = Math.max(0, Number(monthlyAmount || 0));
      let adv = Math.max(0, Number(advanceAmount || 0));
      let out = Math.max(0, Number(currentOutAmount || 0));
      if (m === 0) return { nextAdv: adv, nextOut: out };
      if (adv > 0) {
        if (adv >= m) {
          adv = adv - m; // fully consumed from advance
        } else {
          const remainder = m - adv;
          adv = 0;
          out = out + remainder;
        }
      } else {
        out = out + m;
      }
      return { nextAdv: adv, nextOut: out };
    };

    let flatOps = [];
    let shopOps = [];
    let empOps = [];
    if (runMonthlySections) {
      // 1) Flats
      const flats = await Flat.find({}, { _id: 1, maintenanceRecord: 1 }).lean();
      for (const f of (flats || [])) {
        const mr = f?.maintenanceRecord || {};
        const monthly = Number(mr?.MonthlyMaintenance || 0);
        const advAmt = Number(mr?.AdvanceMaintenance?.amount || 0);
        const outAmt = Number(mr?.monthlyOutstandings?.amount || 0);
        if (monthly <= 0) continue;
        const { nextAdv, nextOut } = addOrConsume(monthly, advAmt, outAmt);
        flatOps.push({
          updateOne: {
            filter: { _id: f._id },
            update: {
              $set: {
                'maintenanceRecord.AdvanceMaintenance.amount': Math.max(0, nextAdv),
                'maintenanceRecord.monthlyOutstandings.amount': Math.max(0, nextOut),
              }
            }
          }
        });
      }
      if (flatOps.length) await Flat.bulkWrite(flatOps);

      // 1) Shops
      const shops = await Shop.find({}, { _id: 1, maintenanceRecord: 1 }).lean();
      for (const s of (shops || [])) {
        const mr = s?.maintenanceRecord || {};
        const monthly = Number(mr?.MonthlyMaintenance || 0);
        const advAmt = Number(mr?.AdvanceMaintenance?.amount || 0);
        const outAmt = Number(mr?.monthlyOutstandings?.amount || 0);
        if (monthly <= 0) continue;
        const { nextAdv, nextOut } = addOrConsume(monthly, advAmt, outAmt);
        shopOps.push({
          updateOne: {
            filter: { _id: s._id },
            update: {
              $set: {
                'maintenanceRecord.AdvanceMaintenance.amount': Math.max(0, nextAdv),
                'maintenanceRecord.monthlyOutstandings.amount': Math.max(0, nextOut),
              }
            }
          }
        });
      }
      if (shopOps.length) await Shop.bulkWrite(shopOps);

      // 2) Employees - from embedded salaryRecord on Employee
      const Employee = require('../models/employee');
      const employees = await Employee.find({}, { _id: 1, salaryRecord: 1 }).lean();
      for (const e of (employees || [])) {
        const sr = e?.salaryRecord || {};
        const monthlySalary = Number(sr?.MonthlySalary || 0);
        const loanAmt = Number(sr?.loan?.amount || 0);
        const monthlyPay = Number(sr?.monthlyPayables?.amount || 0);
        if (monthlySalary <= 0) continue;
        let remainingLoan = Math.max(0, loanAmt);
        let nextMonthlyPay = monthlyPay;
        if (remainingLoan > 0) {
          if (remainingLoan >= monthlySalary) {
            remainingLoan = remainingLoan - monthlySalary;
          } else {
            const rem = monthlySalary - remainingLoan;
            remainingLoan = 0;
            nextMonthlyPay = nextMonthlyPay + rem;
          }
        } else {
          nextMonthlyPay = nextMonthlyPay + monthlySalary;
        }
        empOps.push({
          updateOne: {
            filter: { _id: e._id },
            update: {
              $set: {
                'salaryRecord.loan.amount': Math.max(0, remainingLoan),
                'salaryRecord.monthlyPayables.amount': Math.max(0, nextMonthlyPay),
              }
            }
          }
        });
      }
      if (empOps.length) await Employee.bulkWrite(empOps);
    }

    // 3) Electricity Bills - add MonthlyBill into monthlyPayables whenever current date is on/after month-after-creation (non-idempotent per call, independent of 1st)
    const bills = await ElectricityBill.find({}, {
      _id: 1, dateOfCreation: 1, BillRecord: 1
    }).lean();
    const billOps = [];
    // Helpers based on PKT-localized dates
    const addMonths = (d, n) => {
      const dt = new Date(d.getTime());
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth();
      const day = dt.getUTCDate();
      const next = new Date(Date.UTC(y, m + n, day, 0, 0, 0, 0));
      return next;
    };
    const toLocalDay = (d) => new Date(d.getTime() + tzOffsetMinutes * 60 * 1000);
    const toUTCFromLocal = (d) => new Date(d.getTime() - tzOffsetMinutes * 60 * 1000);

    for (const b of bills || []) {
      const createdUTC = b?.dateOfCreation ? new Date(b.dateOfCreation) : null;
      const monthlyBill = Number(b?.BillRecord?.MonthlyBill || 0);
      if (!createdUTC || monthlyBill <= 0) continue;

      // In PKT-local domain, if today is on/after one month after creation, add MonthlyBill (every invocation)
      const createdLocal = toLocalDay(new Date(Date.UTC(
        createdUTC.getUTCFullYear(),
        createdUTC.getUTCMonth(),
        createdUTC.getUTCDate(), 0, 0, 0, 0
      )));
      const firstChargeLocal = addMonths(createdLocal, 1);
      if (toLocalDay(localNow) >= firstChargeLocal) {
        billOps.push({
          updateOne: {
            filter: { _id: b._id },
            update: { $inc: { 'BillRecord.monthlyPayables.amount': monthlyBill } }
          }
        });
      }
    }
    if (billOps.length) await ElectricityBill.bulkWrite(billOps);

    res.json({
      success: true,
      flatsUpdated: flatOps.length,
      shopsUpdated: shopOps.length,
      employeesUpdated: empOps.length,
      billsUpdated: billOps.length,
      ranMonthlySections: runMonthlySections,
      runAt: now
    });
  } catch (err) {
    console.error('auto/monthly-rollover error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


