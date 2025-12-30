const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    userName: { type: String, required: true, trim: true },
    cnicNumber: { type: String },
    userPhoto: { type: String, default: null },
    userMobile: { type: Number, required: true },
    dateOfJoining: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const ImageSchema = new Schema(
  { url: { type: String, required: true, trim: true } },
  { _id: false }
);

const ShopSchema = new Schema(
  {
    shopNumber: { type: String, required: true, trim: true },
    serialNumber: { type: Number },
    owner: UserSchema,
    activeStatus: { type: String, enum: ['Tenant', 'Owner'], default: 'Owner' },
    tenant: UserSchema,
    maintenanceRecord:{
      MonthlyMaintenance:{type:Number,default:0},
      Outstandings:{
        amount:{type:Number,default:0},
        fromDate:{type:Date,default:Date.now},
        toDate:{type:Date,default:Date.now},
      },
      OtherOutstandings:{
        remarks:{type:String,default:''},
        amount:{type:Number,default:0},
      },
      monthlyOutstandings:{ 
        amount:{type:Number,default:0},
      },
      AdvanceMaintenance:{
        amount:{type:Number,default:0},
        fromDate:{type:Date,default:Date.now},
        toDate:{type:Date,default:Date.now},
      },
      paidAmount:{type:Number,default:0},
      
    },
    documentImages: [ImageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', ShopSchema);





