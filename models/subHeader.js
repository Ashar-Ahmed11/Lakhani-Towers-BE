const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubHeaderSchema = new Schema(
  {
    header: { type: Schema.Types.ObjectId, ref: 'CustomHeader', required: true },
    subHeaderName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubHeader', SubHeaderSchema);


