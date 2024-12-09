const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// Tạo cấu hình lưu trữ cho file Excel (raw)
const excelStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lessons', // Thư mục lưu trữ trên Cloudinary
    allowed_formats: ['xlsx', 'xls'], // Định dạng file Excel cho phép
    resource_type: 'raw', // Raw để lưu file không phải media
  },
});

// Tạo cấu hình lưu trữ cho ảnh
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'image', // Thư mục lưu trữ ảnh trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'], // Định dạng ảnh cho phép
    resource_type: 'image', // Để chỉ lưu trữ ảnh
  },
});

// Khởi tạo multer với storage cho file Excel
const excelUpload = multer({ storage: excelStorage });

// Khởi tạo multer với storage cho ảnh
const imageUpload = multer({ storage: imageStorage });

module.exports = { excelUpload, imageUpload, cloudinary };