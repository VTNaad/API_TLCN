const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");
const Schema = mongoose.Schema;

const courseSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true }, // Giá tiền của khóa học
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }], // Các buổi học thuộc khóa học này
  },
  { timestamps: true }
);

// Add Plugins
courseSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Course", courseSchema);
