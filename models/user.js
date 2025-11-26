const mongoose = require('mongoose');

const { Schema } = mongoose;

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
    userPhoto: { type: String, default: null },
    userMobile: { type: Number, required: true },
    incomingRecords: [{ type: Schema.Types.ObjectId, ref: 'CustomHeaderRecord' }],
    expenseRecords: [{ type: Schema.Types.ObjectId, ref: 'CustomHeaderRecord' }],
    ownerOf: [UserRelationRefSchema],
    tenantOf: [UserRelationRefSchema],
    renterOf: [UserRelationRefSchema],
    dateOfJoining: { type: Date, default: Date.now },
    payScore: [PayScoreItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);