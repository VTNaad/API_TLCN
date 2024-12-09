const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");
const Schema = mongoose.Schema;

const supportRequestSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    requestTime: { type: Date, default: Date.now },
    isResolved: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

// Add Plugins
supportRequestSchema.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: "all",
});

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
