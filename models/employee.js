const mongoose = require('mongoose');

const { Schema } = mongoose;

const EmployeeSchema = new Schema(
  {
    employeeName: { type: String, required: true, trim: true },
    employeePhoto: { type: String, default: null },
    employeePhone: { type: Number, required: true },
    employeeCNIC: { type: String },
    employeeVehicleNumber: { type: String, default: null },
    drivingLicenseNumber: { type: String, default: null },
    // employeeSalaryRecords: [{ type: Schema.Types.ObjectId, ref: 'Salary' }],
    salaryRecord: {
      MonthlySalary: { type: Number, default: 0 },
      Payables: {
        amount: { type: Number, default: 0 },
        fromDate: { type: Date, default: Date.now },
        toDate: { type: Date, default: Date.now },
      },
      monthlyPayables: {
        amount: { type: Number, default: 0 },
      },
      loan: {
        amount: { type: Number, default: 0 },
        fromDate: { type: Date, default: Date.now },
        toDate: { type: Date, default: Date.now },
        paidAmount: { type: Number, default: 0 },
      },
      paidAmount: { type: Number, default: 0 },

    },
    dateOfJoining: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', EmployeeSchema);


