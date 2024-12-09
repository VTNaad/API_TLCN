const User = require('../models/User');
const PackageInfo = require('../models/PackageInfo');
const Package = require('../models/Package');

class PackageController {
  
  async calculateTotalPrice(req, res) {
    try {
      const result = await Package.aggregate([
        {
          $lookup: {
            from: "packageinfos", // MongoDB collection name for PackageInfo
            localField: "packageInfo", // Field in Package referencing PackageInfo
            foreignField: "_id", // Field in PackageInfo
            as: "packageInfoDetails", // Merged field name
          },
        },
        { $unwind: "$packageInfoDetails" }, // Decompose array to objects
        {
          $group: {
            _id: null, // Group all documents together
            totalPrice: { $sum: "$packageInfoDetails.price" }, // Sum up prices
          },
        },
      ]);

      if (!result || result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No packages found to calculate total price.",
        });
      }

      const totalPrice = result[0].totalPrice;

      res.json({
        success: true,
        data: { totalPrice },
      });
    } catch (error) {
      console.error("Error calculating total price:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while calculating the total price.",
      });
    }
  }

  // [GET] /package/count
  async getPackageCount(req, res) {
    try {
      const packageCount = await Package.countDocuments();
      res.json({ success: true, data: { packageCount } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  // [POST] /package/create
  async createPackage(req, res) {
    const { registrationDate, expirationDate, isRenewal, packageInfo } = req.body;

    try {
      const newPackage = new Package({ 
        registrationDate, 
        expirationDate, 
        isRenewal, 
        packageInfo 
      });
      await newPackage.save();

      res.status(201).json({
        success: true,
        message: "Package created successfully",
        data: newPackage,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /package
  async getAllPackages(req, res) {
    try {
      const packages = await Package.find().populate('packageInfo');
      res.json({
        success: true,
        data: packages,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [GET] /package/:id
  async getPackageById(req, res) {
    try {
      const packages = await Package.findById(req.params.id).populate('packageInfo');
      if (!packages) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }
      res.json({ success: true, data: packages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [PUT] /package/:id
  async updatePackage(req, res) {
    const { registrationDate, expirationDate, isRenewal, packageInfo } = req.body;

    try {
      const currentPackage = await Package.findById(req.params.id).populate('packageInfo');
      if (!currentPackage) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      let regDate, expDate;

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;  // Định dạng YYYY-MM-DD
      if ((registrationDate && !dateRegex.test(registrationDate)) || (expirationDate && !dateRegex.test(expirationDate))) {
          return res.status(400).json({ success: false, message: "Registration Date or Expiration Date must be in YYYY-MM-DD format!" });
      }
      if (registrationDate && !expirationDate){
        regDate = 0, expDate = 1;
      }
      // Nếu người dùng nhập vào ngày đăng ký, lấy ngày hết hạn từ database
      if (registrationDate && !expirationDate) {
        regDate = new Date(registrationDate);
        if (isNaN(regDate.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid Registration Date!" });
        }

        // Lấy ngày hết hạn từ database
        expDate = currentPackage.expirationDate;
      }
      // Nếu người dùng nhập vào ngày hết hạn, lấy ngày đăng ký từ database
      if (!registrationDate && expirationDate) {
        expDate = new Date(expirationDate);
        if (isNaN(expDate.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid Expiration Date!" });
        }

        // Lấy ngày đăng ký từ database
        regDate = currentPackage.registrationDate;
      }

      if (registrationDate && expirationDate){
        regDate = new Date(registrationDate);
        expDate = new Date(expirationDate);
    
        // Kiểm tra nếu ngày đăng ký và ngày hết hạn hợp lệ
        if (isNaN(regDate.getTime()) || isNaN(expDate.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid Registration Date or Expiration Date!" });
        }
      }

      // Kiểm tra nếu ngày đăng ký phải trước ngày hết hạn
      if (regDate >= expDate) {
        return res.status(400).json({ success: false, message: "Registration date must be before Expiration Date!" });
      }

      if (packageInfo) {
        const packageInfoData = await PackageInfo.findById(packageInfo);
        if (!packageInfoData) {
          return res.status(404).json({ success: false, message: "PackageInfo not found!" });
        }
  
        // Nếu có ngày đăng ký, tính lại ngày hết hạn từ registrationDate và packageInfo.timeDuration
        if (registrationDate) {
          regDate = new Date(registrationDate);
          if (isNaN(regDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid Registration Date!" });
          }
  
          // Tính toán expirationDate từ registrationDate và timeDuration của packageInfo
          expDate = new Date(regDate);
          expDate.setDate(expDate.getDate() + packageInfoData.timeDuration);
        } else {
          // Nếu không có ngày đăng ký, lấy ngày đăng ký từ database và tính toán ngày hết hạn từ timeDuration
          regDate = currentPackage.registrationDate;
          expDate = new Date(regDate);
          expDate.setDate(expDate.getDate() + packageInfoData.timeDuration);
        }
      }
      
      const updatedPackage = await Package.findByIdAndUpdate(
        req.params.id,
        { registrationDate: regDate , expirationDate: expDate, isRenewal, packageInfo, updatedAt: Date.now() },
        { new: true }
      ).populate('packageInfo');

      if (!updatedPackage) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      res.json({
        success: true,
        message: "Package updated successfully",
        data: updatedPackage,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [DELETE] /package/:id
  async deletePackage(req, res) {
    try {
      const deletedPackage = await Package.findByIdAndDelete(req.params.id);

      if (!deletedPackage) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      res.json({
        success: true,
        message: "Package deleted successfully",
        data: deletedPackage,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // [POST] /package/add
  async addPackageToUser (req, res) {
    const { userId, packageInfoId } = req.body;
    try {
      // Tìm user và PackageInfo
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found!' });
      }
  
      const packageInfo = await PackageInfo.findById(packageInfoId);
      if (!packageInfo) {
        return res.status(404).json({ message: 'PackageInfo not found!' });
      }
  
          // Kiểm tra nếu user đã có package và package chưa hết hạn
      if (user.package) {
        const currentPackage = await Package.findById(user.package);
        if (currentPackage) {
          return res.status(400).json({
            success: false,
            message: 'User already has an active package. Cannot add a new package.',
            currentPackage,
          });
        }
      }

      // Tính registrationDate và expirationDate
      const registrationDate = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(registrationDate.getDate() + packageInfo.timeDuration - 1);
  
      // Tạo gói mới
      const newPackage = await Package.create({
        registrationDate,
        expirationDate,
        packageInfo: packageInfo._id,
      });
  
      // Gán package cho user
      user.package = newPackage._id;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'Package added to user successfully!',
        user,
        package: newPackage,
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  };

  // [DELETE] /package/:id/remove
  async removeUserPackage (req, res) {
    const { id } = req.params; 
  
    try {
      // Tìm user theo ID
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Kiểm tra user đã có package chưa
      if (!user.package) {
        return res.status(400).json({ message: 'User has no active package' });
      }
  
      // Loại bỏ package
      const packageId = user.package;
      user.package = null; // Đặt package về null
      await user.save(); // Lưu user lại
  
      // Optional: Xóa package khỏi bảng Package nếu cần
      await Package.findByIdAndDelete(packageId);
  
      res.status(200).json({
        message: 'Package removed from user successfully',
        user,
      });
    } catch (error) {
      console.error('Error removing package from user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  async renewPackage (req, res) {
    const { userId } = req.body;
  
    try {
      // Tìm user và package hiện tại
      const user = await User.findById(userId).populate('package');
      if (!user || !user.package) {
        return res.status(404).json({ message: 'User or package not found!' });
      }
  
      const packageInfo = await PackageInfo.findById(user.package.packageInfo);
      if (!packageInfo) {
        return res.status(404).json({ message: 'PackageInfo not found!' });
      }
  
      // Gia hạn thêm thời gian
      const newExpirationDate = new Date(user.package.expirationDate);
      newExpirationDate.setDate(newExpirationDate.getDate() + packageInfo.timeDuration - 1);
  
      //user.package.registrationDate = new Date();
      user.package.expirationDate = newExpirationDate;
      await user.package.save();
  
      res.status(200).json({
        message: 'Package renewed successfully!',
        package: user.package,
      });
    } catch (error) {
      console.error('Error renewing package:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  };

}

module.exports = new PackageController();