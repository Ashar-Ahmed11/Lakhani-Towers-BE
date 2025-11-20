const mongoose = require('mongoose');

const CustomHeaderSchema = new mongoose.Schema(
  {
    headerName: { type: String, required: true, trim: true },
    headerType: { type: String, enum: ['Expense', 'Incoming'], required: true },
    recurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomHeader', CustomHeaderSchema);


