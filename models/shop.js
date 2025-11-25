const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserRefStateSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    owned: { type: Boolean },
    active: { type: Boolean },
  },
  { _id: false }
);

const ImageSchema = new Schema(
  { url: { type: String, required: true, trim: true } },
  { _id: false }
);

const ShopSchema = new Schema(
  {
    shopNumber: { type: String, required: true, trim: true },
    owners: [UserRefStateSchema],
    rented: { type: Boolean, default: false },
    activeStatus: { type: String, enum: ['Tenant', 'Owner'], default: 'Owner' },
    tenant: [UserRefStateSchema],
    renter: [UserRefStateSchema],
    documentImages: [ImageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', ShopSchema);





