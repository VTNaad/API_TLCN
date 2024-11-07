const express = require('express');
const multer = require('multer');
const userController = require("../controllers/userController");
const roleController = require("../controllers/roleController");
const lessonController = require("../controllers/lessonController")
const { verifyAccessToken, isAdmin } = require("../middleware/jwt");
const upload = multer({ dest: "uploads/" });
const router = express.Router();

// API User
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

module.exports = router; //export default