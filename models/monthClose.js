const mongoose = require('mongoose');

const { Schema } = mongoose;

const MonthCloseSchema = new Schema(
  {
    // e.g., '2025-11' representing November 2025
    month: { type: String, required: true, unique: true },
    closingBalance: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MonthCloseSchema.index({ month: 1 }, { unique: true });

module.exports = mongoose.model('MonthClose', MonthCloseSchema);


