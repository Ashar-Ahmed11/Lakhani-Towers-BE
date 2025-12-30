const mongoose = require('mongoose');

const { Schema } = mongoose;

const MiscellaneousExpenseSchema = new Schema(
  {
    GivenTo: { type: 'String', required: true },
 
    // employeeSalaryRecords: [{ type: Schema.Types.ObjectId, ref: 'Salary' }],
   lineItem:{type:String,required:true},
   remarks:{type:String,default:''},
   amount:{type:Number,required:true},
    paidAmount: { type: Number, default: 0 },
    serialNumber: { type: Number },
    dateOfCreation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MiscellaneousExpense', MiscellaneousExpenseSchema);


