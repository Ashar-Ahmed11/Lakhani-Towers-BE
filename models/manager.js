const mongoose = require('mongoose');

const ManagerSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, default: 'manager' },
    payOnlyShopMaintenance: { type: Boolean, default: false },
    changeAllAmounts: { type: Boolean, default: false },
    payAllAmounts: { type: Boolean, default: false },
    salariesDistribution: { type: Boolean, default: false },
    lumpSumAmounts: { type: Boolean, default: false },
    editRole: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Manager', ManagerSchema);



