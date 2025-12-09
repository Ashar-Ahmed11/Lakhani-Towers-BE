const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    userName: { type: String, required: true, trim: true },
    userMobile: { type: Number, required: true },
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
    owner: UserSchema,
    rented: { type: Boolean, default: false },
    activeStatus: { type: String, enum: ['Tenant', 'Owner'], default: 'Owner' },
    tenant: UserSchema,
    renter: UserSchema,
    documentImages: [ImageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', ShopSchema);





