const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
  title: { type: String, required: true },
  excelFile: { type: String, required: true }, // Đường dẫn file Excel chứa từ vựng và thông tin liên quan
  status: { 
    type: String, 
    enum: ["active", "passive"], // Chỉ cho phép "active" và "passive"
    default: "active",
    validate: {
      validator: function (value) {
        return ["active", "passive"].includes(value); // Kiểm tra giá trị hợp lệ
      },
      message: (props) => `${props.value} is not a valid status!` // Thông báo lỗi
    }
  },
  }, { timestamps: true }
);

// Add Plugins
lessonSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Lesson", lessonSchema);
