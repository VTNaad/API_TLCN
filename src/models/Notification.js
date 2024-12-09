const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    sentTime: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

// Add Plugins
notificationSchema.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: "all",
});

module.exports = mongoose.model('Notification', notificationSchema);
