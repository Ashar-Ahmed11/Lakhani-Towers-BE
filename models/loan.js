const mongoose = require('mongoose');

const { Schema } = mongoose;

const LoanSchema = new Schema(
  {
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', LoanSchema);





