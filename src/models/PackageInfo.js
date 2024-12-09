const mongoose = require('mongoose');
var mongooseDelete = require("mongoose-delete");
const Schema = mongoose.Schema;

const packageInfoSchema = new Schema({
    packageName: { type: String, required: true },
    description: { type: String, required: true },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value >= 0; // Kiểm tra giá trị không âm
        },
        message: "Price must be Positive Number",
      },
    },
    timeDuration: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 0; // Kiểm tra số nguyên không âm
        },
        message: "Time duration must be Integer",
      },
    },
  },
  { timestamps: true }
);
 
// Add Plugins
packageInfoSchema.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: "all",
});

module.exports = mongoose.model('PackageInfo', packageInfoSchema);
