const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserRefStateSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    owned: { type: Boolean }, // for Owners only
    active: { type: Boolean }, // for Tenant / Renter
  },
  { _id: false }
);

const ResidentCnicSchema = new Schema(
  {
    cnicName: { type: String, required: true, trim: true },
    cnicNumber: { type: String, required: true },
  },
  { _id: false }
);

const VehicleSchema = new Schema(
  {
    vehicleName: { type: String, required: true, trim: true },
    vehicleNumber: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const FlatSchema = new Schema(
  {
    flatNumber: { type: String, required: true, trim: true },
    owners: [UserRefStateSchema],
    rented: { type: Boolean, default: false },
    activeStatus: { type: String, enum: ['Tenant', 'Owner'], default: 'Owner' },
    tenant: [UserRefStateSchema],
    renter: [UserRefStateSchema],
    residentsCnics: [ResidentCnicSchema],
    vehicleNo: [VehicleSchema],
    documentImages: [ImageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flat', FlatSchema);


