const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReceiptsSchema = new Schema(
    {
        receiptId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'receiptModel'
        },

        receiptModel: {
            type: String,
            required: true,
            enum: ['Flat', 'Shop', 'Salary','ElectricityBill','MiscellaneousExpense','Events'] // add all allowed models
        },

        receiptSlug: { type: String, required: true },

        type: { type: String, required: true, enum: ['Paid', 'Recieved'] },

        amount: { type: Number, default: 0 },

        dateOfCreation: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Receipts', ReceiptsSchema);


