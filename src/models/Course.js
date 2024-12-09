// Course model
const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");
const Schema = mongoose.Schema;

const courseSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: true }
);

courseSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Course", courseSchema);
