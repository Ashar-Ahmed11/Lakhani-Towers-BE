const mongoose = require('mongoose');

const { Schema } = mongoose;

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MonthItemSchema = new Schema(
  {
    status: { type: String, enum: ['Paid', 'Pending', 'Due'], default: 'Pending' },
    amount: { type: Number, required: true },
    occuranceDate: { type: Date, default: Date.now },
    paidAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const SalarySchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    documentImages: [ImageSchema],
    amount: { type: Number, required: true },
    dateOfCreation: { type: Date, default: Date.now },
    month: [MonthItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Salary', SalarySchema);


