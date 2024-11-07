const Lesson = require("../models/Lesson");
const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");
const axios = require("axios");
const xlsx = require("xlsx");

class LessonController {
    // [POST] /lesson/create
    async createLesson(req, res) {
      const { title } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Excel file is required" });
      }

      // Kiểm tra định dạng file (mimetype)
      const fileType = file.mimetype;
      if (!["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(fileType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file format. Only Excel files are allowed",
        });
      }

      try {
        // Upload file Excel lên Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: "raw", // Raw để lưu các file không phải media
          folder: "lessons",
        });

        // Lưu dữ liệu lesson vào MongoDB
        const newLesson = new Lesson({
          title,
          excelFile: result.secure_url,
        });

        await newLesson.save();

        // Xóa file local sau khi upload thành công
        fs.unlinkSync(file.path);

        res.status(201).json({
          success: true,
          message: "Create successful",
          data: newLesson,
        });
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .json({ success: false, message: "An error occurred: " + error });
      }

    };

    // [GET] /lesson/
    async getAllLessons (req, res) {
        try {
            const lessons = await Lesson.find();
            res.status(200).json({ success: lessons ? true : false, lessons });
        } catch (error) {
            res.status(500).json({ success: false, message: error });
        }
    };
    // [GET] /lesson/:id
    async getLessonById (req, res) {
        try {
          const { id } = req.params;
          const lesson = await Lesson.findById(id);
          res.status(200).json({ success: lesson ? true : false, lesson });
        } catch (error) {
            res.status(500).json({ success: false, message: error });
        }
    };
    // [PUT] /lesson/:id
    async updateLesson (req, res) {
      const { id } = req.params;
      const { title } = req.body;
      try {
        const lesson = await Lesson.findById(id);
        if (!lesson) {
          return res.status(404).json({ error: "Lesson not found" });
        }

        if (req.file) {
          const fileType = req.file.mimetype;
          if (!["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(fileType)) {
            return res.status(400).json({
              success: false,
              message: "Invalid file format. Only Excel files are allowed",
            });
          }
          // Xóa file cũ trên Cloudinary
          const publicId = lesson.excelFile.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

          // Upload file mới
          const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "raw",
            folder: "lessons",
          });

          lesson.excelFile = result.secure_url;
          fs.unlinkSync(req.file.path);
        }

        lesson.title = title || lesson.title;
        await lesson.save();
          
        res.status(200).json({
          success: true,
          message: "Lesson update successful",
          data: lesson,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "An error occurred " + error,
        });
      }    
    };
    // [DELETE] /lesson/:id
    async deleteLesson(req, res) {
        try {
          const { id } = req.params;
      
          // Kiểm tra nếu Lesson tồn tại
          const lesson = await Lesson.findById(id);
          if (!lesson) {
            return res.status(404).json({
              success: false,
              message: "Lesson not found",
            });
          }
          await Lesson.delete({ _id: id }); 
          res.status(200).json({
            success: true,
            message: "Delete successful",
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: "An error occurred: " + error.message,
          });
        }
    };
    // [DELETE] /lesson/:id/force
    async forceDeleteLesson (req, res) {
        try {
          const { id } = req.params;
          const lesson = await Lesson.findById(id);
          if (!lesson) {
            return res.status(404).json({
              success: false,
              message: "Lesson not found",
            });
          }
          await Lesson.deleteOne({ _id: id });   
          res.status(200).json({
            success: true,
            message: "Force delete successful",
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: "An error occurred: " + error.message,
          });
        }
    };
    // [PATCH] /lesson/:id/restore
    async restoreLesson (req, res) {
        try {
        const { id } = req.params;
    
        // Restore bản ghi đã bị xóa mềm
        await Lesson.restore({ _id: id }); // Yêu cầu cấu hình plugin Mongoose Soft Delete
    
        const restoredLesson = await Lesson.findById(id);
    
        if (!restoredLesson) {
            return res.status(404).json({
            success: false,
            message: "Lesson not found",
            });
        }
    
        res.status(200).json({
            success: true,
            message: "Restore successful",
            restoredLesson,
        });
        } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred: " + error.message,
        });
        }
    };
    // [GET] /lesson/:/readLesson
    async readLesson(req, res) {
        const { id } = req.params; // Nhận ID bài học từ request
      
        try {
          // Lấy bài học từ MongoDB bằng ID
          const lesson = await Lesson.findById(id);
          if (!lesson) {
            return res.status(404).json({
              success: false,
              message: "Lesson not found",
            });
          }
      
          // Lấy URL của file Excel từ bài học
          const fileUrl = lesson.excelFile;
      
          // Tải file Excel từ Cloudinary
          const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
          const data = response.data;
      
          // Đọc dữ liệu Excel
          const workbook = xlsx.read(data, { type: "buffer" });
          const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
          const sheet = workbook.Sheets[sheetName];
      
          // Chuyển đổi dữ liệu từ sheet sang JSON
          //const jsonData = xlsx.utils.sheet_to_json(sheet, { header: ["english", "phonetic", "translation"], defval: "" });
          const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          res.status(200).json({
            success: true,
            data: jsonData,
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: "An error occurred: " + error.message,
          });
        }
    };

}
module.exports = new LessonController();