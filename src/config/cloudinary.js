const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// Tạo cấu hình lưu trữ cho Multer sử dụng Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'uploads', // Thư mục lưu trữ trên Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg'], // Định dạng ảnh cho phép
    },
  });
  
  const upload = multer({ storage: storage });

module.exports = upload;