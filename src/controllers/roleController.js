const {
  checkDocumentExistence,
  checkDocumentById,
} = require("../middleware/checkDocumentMiddleware");
const Role = require("../models/Role");
class RoleController {
  //[GET] /role/:id
  async getById(req, res) {
    try {
      let role = await Role.findOne({ _id: req.params.id });
      res.status(200).json({ success: role ? true : false, role });
    } catch (error) {
      res.status(500).json({ success: false, message: error });
    }
  }
  //[GET] /role/
  async getAll(req, res) {
    try {
      let roleList = await Role.find({});
      res.status(200).json({ success: roleList ? true : false, roleList });
    } catch (error) {
      res.status(500).json({ success: false, message: error });
    }
  }

  // [POST] /role/store
  async store(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });
      }

      // Nếu tên chưa tồn tại tạo mới
      const role = new Role({ name });
      const savedRole = await role.save();

      // Trả về tài liệu đã lưu thành công
      res.status(201).json({
        success: true,
        message: "Create successful",
        data: savedRole,
      });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "An error occurred : " + err });
    }
  }

  //[PUT] /role/:id
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Kiểm tra sự tồn tại của tài liệu Role
      const check = await checkDocumentExistence(Role, id, name);
      if (!check.exists) {
        return res.status(400).json({
          success: false,
          message: check.message,
        });
      }
      // Cập nhật Role
      const updatedRole = await Role.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: "Role update successful",
        data: updatedRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred " + error,
      });
    }
  }

  //[DELETE] /role/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const check = await checkDocumentById(Role, id);
      if (!check.exists) {
        return res.status(400).json({
          success: false,
          message: check.message,
        });
      }
      await Role.delete({ _id: req.params.id });
      res.status(200).json({
        success: true,
        message: "Delete successful",
      });
      // res.redirect("back");
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred " + error,
      });
    }
  }
  //[DELETE] /role/:id/force
  async forceDelete(req, res, next) {
    try {
      await Role.deleteOne({ _id: req.params.id });
      res.status(200).json({
        success: true,
        message: "Delete Force successful",
      });
      // res.redirect("back");
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred " + error,
      });
    }
  }
  // [PATCH] /role/:id/restore
  async restore(req, res, next) {
    try {
      await Role.restore({ _id: req.params.id });
      const restoredRole = await Role.findById(req.params.id);
      console.log("Restored Role:", restoredRole);
      res.status(200).json({
        status: true,
        message: "Restored Role",
        restoredRole,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred " + error,
      });
    }
  }
}

module.exports = new RoleController();
