const PackageInfo = require('../models/PackageInfo');

class PackageInfoController {
  // [POST] /packageinfo/create
  async createPackageInfo(req, res) {
    const { packageName, description, price, timeDuration } = req.body;

    try {
      const newPackageInfo = new PackageInfo({ 
        packageName, 
        description, 
        price, 
        timeDuration 
      });
      await newPackageInfo.save();

      res.status(201).json({
        success: true,
        message: "PackageInfo created successfully",
        data: newPackageInfo,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /packageinfo
  async getAllPackageInfo(req, res) {
    try {
      const packageInfos = await PackageInfo.find();
      res.json({
        success: true,
        data: packageInfos,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /packageinfo/:id
  async getPackageInfoById(req, res) {
    try {
      const packageInfo = await PackageInfo.findById(req.params.id);
      if (!packageInfo) {
        return res.status(404).json({ success: false, message: "PackageInfo not found" });
      }
      res.json({ success: true, data: packageInfo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [PUT] /packageinfo/:id
  async updatePackageInfo(req, res) {
    const { packageName, description, price, timeDuration } = req.body;

    try {
      const updatedPackageInfo = await PackageInfo.findByIdAndUpdate(
        req.params.id,
        { packageName, description, price, timeDuration, updatedAt: Date.now() },
        { new: true, runValidators: true } // Bật xác thực khi cập nhật
      );

      if (!updatedPackageInfo) {
        return res.status(404).json({ success: false, message: "PackageInfo not found" });
      }

      res.json({
        success: true,
        message: "PackageInfo updated successfully",
        data: updatedPackageInfo,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [DELETE] /packageinfo/:id
  async deletePackageInfo(req, res) {
    try {
      const deletedPackageInfo = await PackageInfo.delete({_id : req.params.id});

      if (!deletedPackageInfo) {
        return res.status(404).json({ success: false, message: "PackageInfo not found" });
      }

      res.json({
        success: true,
        message: "PackageInfo deleted successfully",
        data: deletedPackageInfo,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PackageInfoController();
