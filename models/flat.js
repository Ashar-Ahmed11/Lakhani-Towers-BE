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



const UserRelationRefSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: 'Flat' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    owned: { type: Boolean }, // for Owner Of
    active: { type: Boolean }, // for Tenant Of / Renter Of
  },
  { _id: false }
);

const PayScoreItemSchema = new Schema(
  {
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    userName: { type: String, required: true, trim: true },
    cnicNumber: { type: String, required: true },
    userPhoto: { type: String, default: null },
    userMobile: { type: Number, required: true },
    dateOfJoining: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const FlatSchema = new Schema(
  {
    flatNumber: { type: String, required: true, trim: true },
    owner: UserSchema,
    rented: { type: Boolean, default: false },
    activeStatus: { type: String, enum: ['Tenant', 'Owner'], default: 'Owner' },
    tenant: UserSchema,
    renter: UserSchema,
    residentsCnics: [ResidentCnicSchema],
    vehicleNo: [VehicleSchema],
    documentImages: [ImageSchema],
    incomingRecords: [{ type: Schema.Types.ObjectId, ref: 'CustomHeaderRecord' }],
    expenseRecords: [{ type: Schema.Types.ObjectId, ref: 'CustomHeaderRecord' }],
    previousOwners: [UserSchema],
    previousTenants: [UserSchema],
    previousRenters: [UserSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flat', FlatSchema);


