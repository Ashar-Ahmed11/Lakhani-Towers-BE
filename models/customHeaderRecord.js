const mongoose = require('mongoose');

const { Schema } = mongoose;

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MonthItemSchema = new Schema(
  {
    status: { type: String, enum: ['Paid', 'Pending', 'Due'], default: 'Pending' },
    amount: { type: Number, required: true },
    occuranceDate: { type: Date, default: Date.now },
    paidAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const CustomHeaderRecordSchema = new Schema(
  {
    header: { type: Schema.Types.ObjectId, ref: 'CustomHeader', required: true },
    purpose: { type: String, default: '' },
    fromUser: { type: Schema.Types.ObjectId, ref: 'User' },
    fromAdmin: { type: Schema.Types.ObjectId, ref: 'Admin' },
    toUser: { type: Schema.Types.ObjectId, ref: 'User' },
    toAdmin: { type: Schema.Types.ObjectId, ref: 'Admin' },
    month: [MonthItemSchema],
    documentImages: [ImageSchema],
    amount: { type: Number, required: true },
    dateOfAddition: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomHeaderRecord', CustomHeaderRecordSchema);


