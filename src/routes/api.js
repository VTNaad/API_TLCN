const express = require('express');

const userController = require("../controllers/userController");
const roleController = require("../controllers/roleController");
const { verifyAccessToken, isAdmin } = require("../middleware/jwt");

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

module.exports = router; //export default