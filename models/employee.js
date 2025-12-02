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
    employeeSalaryRecords: [{ type: Schema.Types.ObjectId, ref: 'Salary' }],
    dateOfJoining: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', EmployeeSchema);


