const express = require('express');
const multer = require('multer');

const userController = require("../controllers/userController");
const roleController = require("../controllers/roleController");
const courseController = require("../controllers/courseController"); 
const lessonController = require("../controllers/lessonController");
const { verifyAccessToken, isAdmin } = require("../middleware/jwt");
const chatHistory = require("../controllers/ChatHistoryController.js");
const AIController = require('../controllers/AIController');
const paymentController = require('../controllers/paymentController.js');
const packageInfoController = require('../controllers/packageInfoController.js');
const packageController = require('../controllers/packageController.js');
const supportRequestController = require('../controllers/supportRequestController.js');
const notificationController = require('../controllers/notificationController.js');
const { processSpeech } = require('../controllers/speechController.js');

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post('/word/practice', upload.single('audio'), processSpeech);

// API User
router.get("/user/count", userController.countUsers);
router.get("/user/getUserToken", verifyAccessToken, userController.getUserFromToken);
router.get("/user/forgotPassword", userController.forgotPassword);
router.get("/user/editProfileSendOTP", userController.editProfileSendOTP);
router.post("/user/sendOTP", userController.sendOTP);
router.get("/user/resetPassword/:resetToken", userController.getResetToken);
router.get("/user/:id", userController.getById);
router.get("/user/", [verifyAccessToken, isAdmin], userController.getAll);

router.post("/user/current", verifyAccessToken, userController.current);
router.post("/user/register", userController.register);
router.post("/user/login", userController.login);

router.put("/user/refreshAccessToken", userController.refreshAccessToken);
router.put("/user/resetPassword", userController.resetPassword);
router.put("/user/:uid", verifyAccessToken, isAdmin, userController.updateByAdmin);
router.put("/user/", verifyAccessToken, userController.update);

router.delete(
  "/user/:id/force",
  [verifyAccessToken, isAdmin],
  userController.forceDelete
);
router.delete("/user/:id", [verifyAccessToken, isAdmin], userController.delete);

router.patch("/user/:id/restore", userController.restore);

// API Role
router.get("/role/:id", roleController.getById);
router.get("/role/", roleController.getAll);
router.post("/role/store", [verifyAccessToken, isAdmin], roleController.store);
router.put("/role/:id", [verifyAccessToken, isAdmin], roleController.update);
router.delete(
  "/role/:id/force",
  [verifyAccessToken, isAdmin],
  roleController.forceDelete
);
router.delete("/role/:id", [verifyAccessToken, isAdmin], roleController.delete);
router.patch(
  "/role/:id/restore",
  [verifyAccessToken, isAdmin],
  roleController.restore
);

// API Lesson
router.get("/lesson/", lessonController.getAllLessons); // Lấy tất cả lesson
router.get("/lesson/:id", lessonController.getLessonById); // Lấy lesson theo ID
router.get("/lesson/:id/readlesson", lessonController.readLesson); // Đọc file Excel lesson

router.post("/lesson/create", upload.single('excelFile'), lessonController.createLesson); // Tạo mới lesson

router.put("/lesson/:id", upload.single('excelFile'), lessonController.updateLesson); // Cập nhật lesson

router.delete("/lesson/:id", lessonController.deleteLesson); // Xóa mềm lesson
router.delete("/lesson/:id/force", lessonController.deleteLesson); // Xóa cứng lesson

router.patch("/lesson/:id/restore", lessonController.restoreLesson); // Khôi phục lesson

// API Course
router.get("/course/", courseController.getAllCourses); // Get all courses
router.get("/course/:id", courseController.getCourseById); // Get course by ID
router.get("/course/:id/lessons", courseController.getLessonsByCourseId); // Get lessons by course ID

router.post("/course/create", courseController.createCourse); // Create new course
router.put("/course/:id", courseController.updateCourse); // Update course
router.put("/course/:courseId/addLesson/:lessonId", courseController.addLessonToCourse); // Add lesson to course

router.delete("/course/:id", courseController.deleteCourse); // Soft delete course
router.delete("/course/:id/force", courseController.forceDeleteCourse); // Force delete course
router.patch("/course/:id/restore", courseController.restoreCourse); // Restore cour
router.get("/course/search/:title", courseController.searchCoursesByTitle);

// API ChatAI
router.post('/ai/chat', AIController.ChatAI);
// API ChatHistory
router.post("/chathistory/save/:userId", verifyAccessToken, chatHistory.saveMessage); // Lưu tin nhắn
router.get("/chathistory/:userId", verifyAccessToken, chatHistory.getChatHistory); // Lấy lịch sử trò chuyện
router.delete("/chathistory/:userId", verifyAccessToken, chatHistory.deleteChatHistory); // Xóa toàn bộ lịch sử trò chuyện

// API Payment
router.get('/payment/vnpay_return', paymentController.vnpayIpn);
router.get('/payment/vnpay_ipn', paymentController.vnpayIpn);

router.post('/payment/create_payment_url', paymentController.createPaymentUrl);
router.post('/payment/querydr', paymentController.queryTransaction);
router.post('/payment/refund', paymentController.refundTransaction);

// API Package
router.get('/package/', packageController.getAllPackages);
router.get('/package/calculateTotalPrice', packageController.calculateTotalPrice);
router.get('/package/count', packageController.getPackageCount);
router.get('/package/:id', packageController.getPackageById);
router.post('/package/create', packageController.createPackage);
router.post('/package/add', packageController.addPackageToUser);
router.post('/package/renew', packageController.renewPackage);
router.put('/package/:id', packageController.updatePackage);
router.delete('/package/:id', packageController.deletePackage);
router.delete('/package/:id/remove', packageController.removeUserPackage); // id của User

// API Package Info
router.get('/packageinfo/', packageInfoController.getAllPackageInfo);
router.get('/packageinfo/:id', packageInfoController.getPackageInfoById);
router.post('/packageinfo/create', packageInfoController.createPackageInfo);
router.put('/packageinfo/:id', packageInfoController.updatePackageInfo);
router.delete('/packageinfo/:id', packageInfoController.deletePackageInfo);

// API Support Request
router.get('/supportrequest/', supportRequestController.getAllSupportRequests);
router.get('/supportrequest/:id', supportRequestController.getSupportRequestById);
router.post('/supportrequest/create', supportRequestController.createSupportRequest);
router.put('/supportrequest/:id', supportRequestController.updateSupportRequest);
router.delete('/supportrequest/:id', supportRequestController.deleteSupportRequest);

// API Notification
router.get('/', notificationController.getAllNotifications);
router.get('/:id', notificationController.getNotificationById);
router.post('/create', notificationController.createNotification);
router.put('/:id', notificationController.updateNotification);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; //export default