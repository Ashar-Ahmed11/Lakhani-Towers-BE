const express = require('express');
const { body, validationResult } = require('express-validator');
const Receipts = require('../models/receipts');
const Counter = require('../models/counter');
const fetchAdmin = require('../middleware/fetchadmin');

const router = express.Router();

async function getNextReceiptSerial() {
  const doc = await Counter.findOneAndUpdate(
    { name: 'receiptsSerial' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return doc.value;
}

// Create receipt
router.post(
  '/',
  fetchAdmin,
  [
    body('receiptId', 'receiptId is required').isMongoId(),
    body('receiptModel', 'receiptModel is required').isString().notEmpty(),
    body('type', 'type must be "Paid" or "Recieved"').isIn(['Paid', 'Recieved']),
    body('amount', 'amount must be a number').isNumeric(),
    body('receiptNick').optional().isString(),
    body('receiptSlug', 'receiptSlug is required').isString(),
    body('dateOfCreation').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { receiptId, receiptModel, type, amount, receiptSlug, dateOfCreation } = req.body;
      const serialNumber = await getNextReceiptSerial();
      const created = await Receipts.create({
        receiptId,
        receiptModel,
        type,
        amount,
        receiptSlug,
        serialNumber,
        dateOfCreation: dateOfCreation ? new Date(dateOfCreation) : new Date(),
      });
      res.json(created);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Backfill serial numbers for existing receipts starting from 00001
router.post('/backfill-serials', async (req, res) => {
  try {
    const receipts = await Receipts.find({}).sort({ createdAt: 1, _id: 1 }).select('_id').lean();
    const ops = [];
    for (let i = 0; i < receipts.length; i++) {
      ops.push({
        updateOne: {
          filter: { _id: receipts[i]._id },
          update: { $set: { serialNumber: i + 1 } }
        }
      });
    }
    if (ops.length > 0) await Receipts.bulkWrite(ops);
    await Counter.findOneAndUpdate(
      { name: 'receiptsSerial' },
      { $set: { value: receipts.length } },
      { upsert: true }
    );
    res.json({ success: true, assigned: receipts.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// List receipts with filters: from, to, q (search in slug), slugExact (exact slug), type (Paid/Recieved)
router.get('/', fetchAdmin, async (req, res) => {
  try {
    const { from, to, q, slugExact, type } = req.query;
    const query = {};
    if (from || to) {
      const TZ_OFFSET_MIN = 300; // PKT UTC+5
      const MS_PER_MIN = 60 * 1000;
      const ymd = (s) => String(s || '').slice(0, 10);
      const parseLocalYmdToUtcRange = (ymdStr) => {
        const parts = ymdStr.split('-').map(Number);
        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
        const startUtcMs = Date.UTC(parts[0], parts[1] - 1, parts[2]) - (TZ_OFFSET_MIN * MS_PER_MIN);
        const endUtcMs = Date.UTC(parts[0], parts[1] - 1, parts[2] + 1) - (TZ_OFFSET_MIN * MS_PER_MIN);
        return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
      };

      const fromRange = from ? parseLocalYmdToUtcRange(ymd(from)) : null;
      const toRange = to ? parseLocalYmdToUtcRange(ymd(to)) : null;

      query.dateOfCreation = {};
      if (fromRange?.start) query.dateOfCreation.$gte = fromRange.start;
      if (toRange?.end) query.dateOfCreation.$lt = toRange.end;
    }
    if (slugExact) {
      query.receiptSlug = String(slugExact);
    }
    if (type && (type === 'Paid' || type === 'Recieved')) {
      query.type = type;
    }
    if (q && !slugExact) {
      query.$or = [
        { receiptSlug: { $regex: String(q), $options: 'i' } },
        { receiptModel: { $regex: String(q), $options: 'i' } },
      ];
    }
    const list = await Receipts.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'receiptId',
        select: 'flatNumber owner.userName shopNumber consumerNumber lineItem employee',
        strictPopulate: false,
        populate: [{ path: 'employee', model: 'Employee', select: 'employeeName', strictPopulate: false }]
      });
    res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get one receipt by id
router.get('/:id', fetchAdmin, async (req, res) => {
  try {
    const item = await Receipts.get ? await Receipts.get(req.params.id) : await Receipts.findById(req.params.id);
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// (Optional) delete a receipt
router.delete('/:id', fetchAdmin, async (req, res) => {
  try {
    await Receipts.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


