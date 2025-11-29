const mongoose = require('mongoose');

const { Schema } = mongoose;

const ImageSchema = new Schema(
  { url: { type: String, required: true, trim: true } },
  { _id: false }
);

const ShopMaintenanceSchema = new Schema(
  {
    maintenancePurpose: { type: String, required: true, trim: true },
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
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopMaintenance', ShopMaintenanceSchema);



