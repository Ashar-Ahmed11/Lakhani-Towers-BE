const express = require('express');
const fetchAdmin = require('../middleware/fetchadmin');
const Receipts = require('../models/receipts');
const MonthClose = require('../models/monthClose');
const CustomHeader = require('../models/customHeader');
const CustomHeaderRecord = require('../models/customHeaderRecord');
const Maintenance = require('../models/maintenance');
const ShopMaintenance = require('../models/shopMaintenance');
const Loan = require('../models/loan');
const Flat = require('../models/flat');
const Shop = require('../models/shop');
const Salary = require('../models/salary');
const ElectricityBill = require('../models/electricityBill');
const MiscellaneousExpense = require('../models/miscellaneousExpense');
const Events = require('../models/events');
const Employee = require('../models/employee');

const router = express.Router();

// Hardcode PKT (UTC+5)
const TZ_OFFSET_MIN = 300;

const toLocal = (d) => new Date(d.getTime() + TZ_OFFSET_MIN * 60 * 1000);
const toUTC = (d) => new Date(d.getTime() - TZ_OFFSET_MIN * 60 * 1000);

const getLocalYMD = (d) => {
  const t = toLocal(d);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
};

const formatMonthKey = (y, m /* 0-based */) => {
  const mm = String(m + 1).padStart(2, '0');
  return `${y}-${mm}`;
};

const getPrevMonthInfo = (base = new Date()) => {
  const { y, m } = getLocalYMD(base);
  const prevY = m === 0 ? y - 1 : y;
  const prevM = m === 0 ? 11 : m - 1;
  // End of prev month at 23:59:59.999 local
  const endOfPrevLocal = new Date(Date.UTC(prevY, prevM + 1, 1, 0, 0, 0, 0));
  endOfPrevLocal.setUTCMilliseconds(-1);
  const monthKey = formatMonthKey(prevY, prevM);
  return { monthKey, endOfPrevUTC: toUTC(endOfPrevLocal) };
};

// Compute closing balance up to endOfPrevUTC using Receipts (Received - Paid)
const computeClosingBalance = async (endOfPrevUTC) => {
  const [paidAgg, receivedAgg] = await Promise.all([
    Receipts.aggregate([
      { $match: { createdAt: { $lte: endOfPrevUTC }, type: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Receipts.aggregate([
      { $match: { createdAt: { $lte: endOfPrevUTC }, type: 'Recieved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  const paid = (paidAgg[0]?.total) || 0;
  const received = (receivedAgg[0]?.total) || 0;
  return Number(received) - Number(paid);
};

// Backend mirror of FE currentBalance formula (no date slicing; snapshot "now")
const computeCurrentBalanceFromModels = async () => {
  // Load required datasets in parallel
  const [
    incomingHeaders, expenseHeaders,
    incomingRecords, expenseRecords,
    maints, shopMaints, loans,
    flats, shops, salaries, bills,
    miscs, events, employees
  ] = await Promise.all([
    CustomHeader.find({ headerType: 'Incoming' }, { _id: 1, recurring: 1 }).lean(),
    CustomHeader.find({ headerType: 'Expense' }, { _id: 1, recurring: 1 }).lean(),
    // Records will be narrowed to header ids below
    CustomHeaderRecord.find({}, { header: 1, amount: 1, month: 1 }).lean(),
    CustomHeaderRecord.find({}, { header: 1, amount: 1, month: 1 }).lean(),
    Maintenance.find({}, { month: 1 }).lean(),
    ShopMaintenance.find({}, { month: 1 }).lean(),
    Loan.find({}, { amount: 1, status: 1 }).lean(),
    Flat.find({}, { maintenanceRecord: 1 }).lean(),
    Shop.find({}, { maintenanceRecord: 1 }).lean(),
    Salary.find({}, { month: 1 }).lean(),
    ElectricityBill.find({}, { 'BillRecord.paidAmount': 1 }).lean(),
    MiscellaneousExpense.find({}, { paidAmount: 1 }).lean(),
    Events.find({}, { paidAmount: 1 }).lean(),
    Employee.find({}, { salaryRecord: 1 }).lean(),
  ]);

  const paidValue = (m) => (m?.status === 'Paid' ? Number(m?.paidAmount > 0 ? m.paidAmount : (m?.amount || 0)) : 0);
  const sumPaid = (months = []) => (Array.isArray(months) ? months.reduce((s, m) => s + paidValue(m), 0) : 0);

  // Prepare header maps for recurring flag
  const incomingHeaderIds = new Set(incomingHeaders.map(h => String(h._id)));
  const expenseHeaderIds = new Set(expenseHeaders.map(h => String(h._id)));
  const headerRecurringMap = new Map([
    ...incomingHeaders.map(h => [String(h._id), !!h.recurring]),
    ...expenseHeaders.map(h => [String(h._id), !!h.recurring]),
  ]);

  // Filter CHRs by type via header membership
  const incomingCHR = (incomingRecords || []).filter(r => incomingHeaderIds.has(String(r.header)));
  const expenseCHR = (expenseRecords || []).filter(r => expenseHeaderIds.has(String(r.header)));
  const isRec = (r) => !!headerRecurringMap.get(String(r.header));
  const oneOffPaid = (r) => {
    const months = Array.isArray(r?.month) ? r.month : [];
    return months.length > 0 ? sumPaid(months) : Number(r?.amount || 0);
  };

  // Incoming side
  const incomingPaid = (incomingCHR || []).reduce((a, r) => a + (isRec(r) ? sumPaid(r.month) : oneOffPaid(r)), 0);
  const maintPaid = (maints || []).reduce((a, m) => a + sumPaid(m?.month || []), 0);
  const shopMaintPaid = (shopMaints || []).reduce((a, m) => a + sumPaid(m?.month || []), 0);
  const flatsPaidAmount = (flats || []).reduce((a, f) => a + Number(f?.maintenanceRecord?.paidAmount || 0), 0);
  const shopsPaidAmount = (shops || []).reduce((a, s) => a + Number(s?.maintenanceRecord?.paidAmount || 0), 0);
  const flatsAdvanceAmount = (flats || []).reduce((a, f) => a + Number(f?.maintenanceRecord?.AdvanceMaintenance?.amount || 0), 0);
  const shopsAdvanceAmount = (shops || []).reduce((a, s) => a + Number(s?.maintenanceRecord?.AdvanceMaintenance?.amount || 0), 0);
  const eventsPaid = (events || []).reduce((a, e) => a + Number(e?.paidAmount || 0), 0);
  const totalIncomingReceived = incomingPaid + maintPaid + shopMaintPaid + flatsPaidAmount + shopsPaidAmount + flatsAdvanceAmount + shopsAdvanceAmount + eventsPaid;

  // Expense side
  const salaryPaid = (salaries || []).reduce((a, s) => a + sumPaid(s?.month || []), 0);
  const chrExpPaid = (expenseCHR || []).reduce((a, r) => a + (isRec(r) ? sumPaid(r.month) : oneOffPaid(r)), 0);
  const loanPaid = (loans || []).reduce((a, l) => a + (l?.status === 'Paid' ? Number(l?.amount || 0) : 0), 0);
  const elecPaid = (bills || []).reduce((a, b) => a + Number(b?.BillRecord?.paidAmount || 0), 0);
  const miscPaid = (miscs || []).reduce((a, m) => a + Number(m?.paidAmount || 0), 0);
  const totalExpensePaid = salaryPaid + chrExpPaid + loanPaid + elecPaid + miscPaid;

  // Employee offsets
  const employeeLoanAmtForBalance = (employees || []).reduce((a, e) => a + Number(e?.salaryRecord?.loan?.amount || 0), 0);
  const employeesPaidAmount = (employees || []).reduce((a, e) => a + Number(e?.salaryRecord?.paidAmount || 0), 0);
  const employeesLoanPaidAmount = (employees || []).reduce((a, e) => a + Number(e?.salaryRecord?.loan?.paidAmount || 0), 0);
  const employeesNonLoanPaid = Math.max(0, employeesPaidAmount - employeesLoanPaidAmount);

  const currentBalance = totalIncomingReceived - totalExpensePaid - employeeLoanAmtForBalance - employeesNonLoanPaid;
  return currentBalance;
};
// POST /api/month-close/run - meant to be called daily; updates only on 1st (PKT) unless forced
router.post('/run', async (req, res) => {
  try {
    const now = new Date();
    const local = toLocal(now);
    const isFirstDayOfMonth = local.getUTCDate() === 1;
    const forceMonthly = String(req.query.forceMonthly || '').toLowerCase() === 'true' ||
                         String(req.query.force || '').toLowerCase() === 'true';

    if (!isFirstDayOfMonth && !forceMonthly) {
      return res.json({ success: true, ranMonthlySections: false });
    }

    const { monthKey, endOfPrevUTC } = getPrevMonthInfo(now);
    // Compute closing using Receipts up to end of previous month (Received - Paid)
    const closingBalance = await computeClosingBalance(endOfPrevUTC);

    await MonthClose.updateOne(
      { month: monthKey },
      { $set: { month: monthKey, closingBalance, computedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true, ranMonthlySections: true, month: monthKey, closingBalance });
  } catch (err) {
    console.error('month-close/run error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/month-close?month=YYYY-MM
router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'month query (YYYY-MM) is required' });
    const doc = await MonthClose.findOne({ month });
    res.json(doc || null);
  } catch (err) {
    console.error('month-close/get error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/month-close/previous?start=YYYY-MM-DD[&forceCompute=true]
router.get('/previous', fetchAdmin, async (req, res) => {
  try {
    const { start, forceCompute } = req.query;
    if (!start) return res.status(400).json({ message: 'start (YYYY-MM-DD) is required' });
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return res.status(400).json({ message: 'Invalid start date' });

    // Derive previous month from provided start date (PKT)
    const { y, m } = getLocalYMD(startDate);
    const prevY = m === 0 ? y - 1 : y;
    const prevM = m === 0 ? 11 : m - 1;
    const monthKey = formatMonthKey(prevY, prevM);

    let doc = await MonthClose.findOne({ month: monthKey });
    if (!doc && String(forceCompute || '').toLowerCase() === 'true') {
      // Compute on-demand if missing
      const lastOfPrevLocal = new Date(Date.UTC(prevY, prevM + 1, 1, 0, 0, 0, 0));
      lastOfPrevLocal.setUTCMilliseconds(-1);
      const endOfPrevUTC = toUTC(lastOfPrevLocal);
      const closingBalance = await computeClosingBalance(endOfPrevUTC);
      doc = await MonthClose.findOneAndUpdate(
        { month: monthKey },
        { $set: { month: monthKey, closingBalance, computedAt: new Date() } },
        { upsert: true, new: true }
      );
    }

    res.json(doc || null);
  } catch (err) {
    console.error('month-close/previous error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


