const cron = require('node-cron');
const User = require('../models/User'); // Import model User
const Package = require('../models/Package'); // Import model Package
const PackageInfo = require('../models/PackageInfo');
const sendMail = require('../util/sendMail');

const checkExpiredPackages = () => {
  // Chạy cron mỗi ngày lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('Running package expiration check...');

    const today = new Date();

    try {
      // Tìm các gói đã hết hạn
      const expiredPackages = await Package.find({ expirationDate: { $lt: today } });

      for (const pkg of expiredPackages) {
        // Tìm user có gói này
        const user = await User.findOne({ package: pkg._id });

        const packageDetails = await Package.findById(pkg._id).populate({
          path: 'packageInfo', // Trường trong Package
          select: 'packageName', // Chỉ lấy packageName từ PackageInfo
        });

        const userEmail = user.email;
        const userName = user.username || "Người dùng"; // Sử dụng "Người dùng" nếu không có tên
        const packageName = packageDetails?.packageInfo?.packageName || "Gói dịch vụ"; // Sử dụng "Gói dịch vụ" nếu không có tên gói

        if (user) {
          const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Thông báo hủy gói dịch vụ</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  color: #333;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 20px auto;
                  padding: 20px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  background-color: #f9f9f9;
                }
                .header {
                  background-color: #ff6347;
                  color: #fff;
                  padding: 10px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                }
                .content {
                  padding: 20px;
                }
                .footer {
                  padding: 10px;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Thông báo hủy gói dịch vụ của website Speaking English</h2>
                </div>
                <div class="content">
                  <p>Chào <strong>${userName}</strong>,</p>
                  <p>Chúng tôi xin thông báo rằng gói thuê <strong>${packageName}</strong> của bạn đã hết hạn.</p>
                  <p>Do đó, gói thuê này đã bị hủy. Chúng tôi thành thật xin lỗi vì sự bất tiện này.</p>
                  <p>Nếu bạn có bất kỳ câu hỏi nào hoặc cần thêm thông tin, vui lòng liên hệ với chúng tôi.</p>
                  <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
                </div>
                <div class="footer">
                  Trân trọng,<br>
                  Speaking English
                </div>
              </div>
            </body>
            </html>`;

          await sendMail.sendMailCancelPackage({
            email: userEmail,
            html,
          });    
          user.package = null; // Gán package của user về null
          await user.save();
        }   

        // Xóa gói đã hết hạn
        await Package.findByIdAndDelete(pkg._id);
      }

      console.log('Package expiration check completed!');
    } catch (error) {
      console.error('Error during package expiration check:', error.message);
    }
  });
};

// const checkExpiredPackages = () => {
//   // Chạy cron mỗi ngày lúc 00:00
//   cron.schedule('0 0 * * *', async () => {
//     console.log('Running package expiration check...');

//     const today = new Date();

//     try {
//       // Tìm các gói đã hết hạn
//       const expiredPackages = await Package.find({ expirationDate: { $lt: today } });

//       for (const pkg of expiredPackages) {
//         // Nếu gói có isRenewal = true, gia hạn thêm
//         if (pkg.isRenewal) {
//           const packageInfo = await PackageInfo.findById(pkg.packageInfo);
//           if (!packageInfo) {
//             console.error(`PackageInfo not found for package ${pkg._id}`);
//             continue;
//           }

//           // Gia hạn thêm thời gian
//           const newExpirationDate = new Date(pkg.expirationDate);
//           newExpirationDate.setDate(newExpirationDate.getDate() + packageInfo.timeDuration);

//           pkg.registrationDate = today; // Đặt lại ngày đăng ký
//           pkg.expirationDate = newExpirationDate;
//           await pkg.save();

//           console.log(`Package ${pkg._id} renewed until ${newExpirationDate}`);
//         } else {
//           // Tìm user có gói này
//           const user = await User.findOne({ package: pkg._id });

//           if (user) {
//             user.package = null; // Gán package của user về null
//             await user.save();
//           }

//           // Xóa gói đã hết hạn
//           await Package.findByIdAndDelete(pkg._id);
//           console.log(`Package ${pkg._id} expired and deleted.`);
//         }
//       }

//       console.log('Package expiration check completed!');
//     } catch (error) {
//       console.error('Error during package expiration check:', error.message);
//     }
//   });
// };


module.exports = checkExpiredPackages;
