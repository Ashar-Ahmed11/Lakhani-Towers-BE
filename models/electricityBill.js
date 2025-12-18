const mongoose = require('mongoose');

const { Schema } = mongoose;

const ElectricityBillSchema = new Schema(
  {
    consumerNumber: { type: Number, required: true },
 
    // employeeSalaryRecords: [{ type: Schema.Types.ObjectId, ref: 'Salary' }],
    BillRecord: {
      MonthlyBill: { type: Number, default: 0 },
      // Payables: {
      //   amount: { type: Number, default: 0 },
      //   fromDate: { type: Date, default: Date.now },
      //   toDate: { type: Date, default: Date.now },
      // },
      monthlyPayables: {
        amount: { type: Number, default: 0 },
      },
      // Tracks last monthly addition based on dateOfCreation schedule
      lastAppliedAt: { type: Date },
      paidAmount: { type: Number, default: 0 },

    },
    dateOfCreation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ElectricityBill', ElectricityBillSchema);


