const mongoose = require('mongoose');

const { Schema } = mongoose;

const EventsSchema = new Schema(
  {
    GivenFrom: { type: 'String', required: true },
    serialNumber: { type: Number },
    // employeeSalaryRecords: [{ type: Schema.Types.ObjectId, ref: 'Salary' }],
    Event: { type: String, required: true },
    amount: { type: Number, required: true },
    // outstandingAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dateOfCreation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Events', EventsSchema);


