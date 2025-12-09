const mongoose = require('mongoose');

const { Schema } = mongoose;

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MaintenanceSchema = new Schema(
  {
    maintenanceAmount: { type: String, required: true, trim: true },
    documentImages: [ImageSchema],
    month: [
      {
        status: { type: String, enum: ['Pending', 'Paid', 'Due'], default: 'Pending' },
        amount: { type: Number, default: 0 },
        occuranceDate: { type: Date, default: Date.now },
        paidAmount: { type: Number, default: 0 },
      },
    ],
    outstanding:{
      amount: { type: Number, default: 0 },
      status: { type: String, enum: [ 'Paid', 'Due'], default: 'Due' },
      FromDate: { type: Date, default: Date.now },
      ToDate: { type: Date, default: Date.now },
    },
    flat: { type: Schema.Types.ObjectId, ref: 'Flat' },
    to: { type: Schema.Types.ObjectId, ref: 'Admin' },
    recordRef: { type: Schema.Types.ObjectId, ref: 'CustomHeaderRecord' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', MaintenanceSchema);


