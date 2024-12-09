const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");
const Schema = mongoose.Schema;

const packageSchema = new Schema({
    registrationDate: { type: Date, required: true },
    expirationDate: { type: Date, required: true },
    isRenewal: { type: Boolean, default: false },
    packageInfo: { type: Schema.Types.ObjectId, ref: 'PackageInfo', required: true }
    },
    { timestamps: true }
);

// Add Plugins
packageSchema.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: "all",
});
  
module.exports = mongoose.model('Package', packageSchema);
