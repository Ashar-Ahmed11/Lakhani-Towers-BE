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
    maintenancePurpose: { type: String, required: true, trim: true },
    maintenanceAmount: { type: String, required: true, trim: true },
    documentImages: [ImageSchema],
    flat: { type: Schema.Types.ObjectId, ref: 'Flat' },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', MaintenanceSchema);


