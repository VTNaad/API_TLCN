const User = require("../models/User");
var jwt = require("jsonwebtoken");
var fs = require("fs");
const crypto = require("crypto");

const { checkDocumentById } = require("../middleware/checkDocumentMiddleware");
const {
  generateAccessToken
} = require("../middleware/jwt");

const { sendMail } = require("../util/sendMail");
class UserController {
  //[GET] /user/:id
  async getById(req, res) {
    try {
      let user = await User.findOne({ _id: req.params.id });
      res.status(200).json({ success: user ? true : false, user });
    } catch (error) {
      res.status(500).json(error);
    }
  }
  //[GET] /user/
  async getAll(req, res) {
    try {
      const queries = { ...req.query };
      // Tách các trường đặc biệt ra khỏi query
      const excludeFields = ["limit", "sort", "page", "fields"];
      excludeFields.forEach((el) => delete queries[el]);

      // Format lại các operators cho đúng cú pháp mongoose
      let queryString = JSON.stringify(queries);
      queryString = queryString.replace(
        /\b(gte|gt|lt|lte)\b/g,
        (matchedEl) => `$${matchedEl}`
      );
      const formatedQueries = JSON.parse(queryString);

      // Filtering
      if (queries?.name) {
        formatedQueries.name = { $regex: queries.name, $options: "i" };
      }

      // Execute query
      let queryCommand = User.find(formatedQueries);

      // Sorting
      if (req.query.sort) {
        // abc,exg => [abc,exg] => "abc exg"
        const sortBy = req.query.sort.split(",").join(" ");
        // sort lần lượt bởi publisher author category nếu truyền  sort("publisher author categories")
        queryCommand = queryCommand.sort(sortBy);
      }

      // fields limiting
      if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ");
        queryCommand = queryCommand.select(fields);
      }

      //Pagination
      // limit: số docs lấy về 1 lần gọi API
      // skip:
      // Dấu + nằm trước số để chuyển sang số
      // +'2' => 2
      // +'asdasd' => NaN
      const page = +req.query.page || 1;
      const limit = +req.query.limit || 10;
      const skip = (page - 1) * limit;
      queryCommand
        .skip(skip)
        .limit(limit)
        .select("-password -role");

      const response = await queryCommand.exec();
      const counts = await User.find(formatedQueries).countDocuments();

      res.status(200).json({
        success: response.length > 0,
        counts,
        users: response.length > 0 ? response : "Cannot get user",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  //[GET] /user/getUserToken
  // Sử dụng verifyAccessToken để xác thực trước khi lấy user
  async getUserFromToken(req, res) {
    try {
      // req.user sẽ chứa dữ liệu người dùng đã được xác thực từ verifyAccessToken
      const { _id } = req.user; // Giả định bạn lưu ID của người dùng trong token
      // Lấy thông tin người dùng từ database
      const user = await User.findById(_id).select("-password "); // Không trả về password
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Trả về thông tin người dùng
      return res.status(200).json({ success: true, user });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "An error occurred", error });
    }
    
  }

  // [POST] /user/register
  async register(req, res) {
    try {
      const { username, password, fullname, email, phone } = req.body;

      if (!username || !password || !fullname || !email || !phone) {
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });
      }

      const user = new User(req.body);
      const savedUser = await user.save();

      // Trả về tài liệu đã lưu thành công
      res.status(200).json({
        success: true,
        message: "Create User successful",
        data: savedUser,
      });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "An error occurred " + err });
    }
  }

  //[PUT] /user/
  async update(req, res, next) {
    try {
      const { _id } = req.user;
      if (!_id || Object.keys(req.body).length === 0)
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });

      // Cập nhật user
      const updatedUser = await User.findByIdAndUpdate(_id, req.body, {
        new: true,
      }).select("-password -role");

      res.status(200).json({
        success: true,
        message: "User update successful",
        updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred : " + error,
      });
    }
  }
  //[PUT] /user/:uid
  async updateByAdmin(req, res, next) {
    try {
      const { uid } = req.params;
      if (Object.keys(req.body).length === 0)
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });

      // Cập nhật user
      const updatedUser = await User.findByIdAndUpdate(uid, req.body, {
        new: true,
      }).select("-password -role");

      res.status(200).json({
        success: true,
        message: "User update successful",
        updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred : " + error,
      });
    }
  }

  //[DELETE] /user/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const check = await checkDocumentById(User, id);
      if (!check.exists) {
        return res.status(400).json({
          success: false,
          message: check.message,
        });
      }

      await User.delete({ _id: req.params.id });
      res.status(200).json({
        success: true,
        message: "Delete successful",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred",
      });
    }
  }
  //[DELETE] /user/:id/force
  async forceDelete(req, res, next) {
    try {
      const { id } = req.params;

      await User.deleteOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Delete Force successful",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred",
      });
    }
  }
  // [PATCH] /user/:id/restore
  async restore(req, res, next) {
    try {
      const { id } = req.params;

      await User.restore({ _id: id });
      await Cart.restore({ _id: id });
      const restoredUser = await User.findById(req.params.id);
      console.log("Restored User:", restoredUser);
      res.status(200).json({
        status: true,
        message: "Restored User",
        restoredUser,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error });
    }
  }

  //[POST] /sendOTP/
  async sendOTP(req, res, next) {
    try {
      const { email, action } = req.query;
      const { username, phone } = req.body;
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });
      let user = await User.findOne({ email });
      let name = await User.findOne({ username });
      // Tạo tài khoản thì ms cần check email exist để loại
      if (action === "CreateAccount"){
        if (!phone || phone.length !== 10 || isNaN(phone)) {
          throw new Error("Valid phone number !!!");
        }
        if (user) throw new Error("User existed !!!");
        if (name) throw new Error("Username existed !!!");
      }
      let otp_code = Math.floor(100000 + Math.random() * 900000);
      otp_code = otp_code.toString();
      const html = `<!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xác nhận OTP</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        color: #333333;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        border: 5px solid #39c6b9;
                        border-radius: 10px;
                    }
                    .content {
                        padding: 20px;
                    }
                    h1 {
                        color: #39c6b9;
                    }
                    p {
                        line-height: 1.5;
                    }
                    a {
                        color: #0099ff;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <h1>Speaking English</h1>
                        <p>Xin chào,</p>
                        <p>Đây là mã OTP của bạn.</p>
                        <strong style="color: #da4f25;">OTP : ${otp_code}</strong>
                        <p>Cảm ơn bạn đã tin tưởng sử dụng web của chúng tôi!</p>
                        <p>Trân trọng,</p>
                        <p>D&H</p>
                    </div>
                </div>
            </body>
            </html>`;
      const data = {
        email,
        html,
      };
      const result = await sendMail(action, data);
      res.status(200).json({ success: true, result, otp_code, action });
    } catch (error) {
      next(error);
    }
  }
  //[GET] /editProfileSendOTP/
  async editProfileSendOTP(req, res, next) {
    try {
      const { email, action } = req.query;
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });
      let user = await User.findOne({ email });
      if (!user) throw new Error("User not existed !!!");
      let otp_code = Math.floor(100000 + Math.random() * 900000);
      otp_code = otp_code.toString();
      const html = `<!DOCTYPE html>
              <html lang="vi">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Xác nhận OTP</title>
                  <style>
                      body {
                          font-family: Arial, sans-serif;
                          font-size: 14px;
                          color: #333333;
                          margin: 0;
                          padding: 0;
                      }
                      .container {
                          max-width: 600px;
                          margin: 0 auto;
                          border: 5px solid #39c6b9;
                          border-radius: 10px;
                      }
                      .content {
                          padding: 20px;
                      }
                      h1 {
                          color: #39c6b9;
                      }
                      p {
                          line-height: 1.5;
                      }
                      a {
                          color: #0099ff;
                          text-decoration: none;
                      }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="content">
                          <h1>Speaking English</h1>
                          <p>Xin chào,</p>
                          <p>Đây là OTP để chỉnh sửa tài khoản của bạn.</p>
                          <strong style="color: #da4f25;">OTP : ${otp_code}</strong>
                          <p>Cảm ơn bạn đã tin tưởng sử dụng web của chúng tôi!</p>
                          <p>Trân trọng,</p>
                          <p>D&H</p>
                      </div>
                  </div>
              </body>
              </html>`;
      const data = {
        email,
        html,
      };
      const result = await sendMail(action, data);
      res.status(200).json({ success: true, result, otp_code, action });
    } catch (error) {
      next(error);
    }
  }
  // [GET] /resetPassword/:resetToken
  async getResetToken(req, res, next) {
    try {
      const resetToken = req.params.resetToken;
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Token is invalid or has expired");
      }

      res.status(200).json({
        success: true,
        message: "Token is valid",
        resetToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // AccessToken => Xác thực, phân quyền người dùng
  // [POST] /user/login
  async login(req, res, next) {
    try {
      var { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });
      }

      // Nếu muốn dùng object thuần (plain obj) thì dùng hàm toObject()
      const response = await User.findOne({ username });
      // Phải có else ở dưới vì khi không đúng mật khẩu thì hàm isCorrectPassword vẫn không sinh ra lỗi
      if (response && (await response.isCorrectPassword(password))) {
        // Phải dùng (plain Obj) để đưa instance mongooseDB về thành object thường
        const { password, role, ...userData } = response.toObject();
        //Tạo accessToken
        const accessToken = generateAccessToken(response._id, role);

        return res.status(200).json({ success: true, accessToken, userData });
      } else {
        res.status(500).json("Invalid credentials !!!");
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "An error occurred : ", error });
    }
  }

  //[POST] /user/current
  async current(req, res, next) {
    try {
      const { _id } = req.user;
      const user = await User.findById(_id).select(
        "-password -role"
      );
      res.status(200).json({
        success: user ? true : false,
        userData: user ? user : "User not found",
      });
    } catch (error) {
      next(error);
    }
  }

  //[PUT] /user/refreshAccessToken
  async refreshAccessToken(req, res, next) {
    try {
      var cert = fs.readFileSync("../key/publickey.crt");
      // Check xem refreshToken có hợp lệ hay không
      jwt.verify(
        cookie.refreshToken,
        cert,
        { algorithms: ["RS256"] },
        async (err, data) => {
          if (err) {
            return res.status(401).json({ success: false, message: err });
          }
          const response = await User.findOne({
            _id: data._id,
            refreshToken: cookie.refreshToken,
          });
          return res.status(200).json({
            success: response ? true : false,
            newAccessToken: response
              ? generateAccessToken(response._id, response.role)
              : "Refresh token not matched !!!",
          });
        }
      );
    } catch (error) {
      next(error);
    }
  }

  //[GET] /forgotPassword/:email
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.query;
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found with this email");
      const resetToken = user.createPasswordChangeToken();
      await user.save();

      const html = `<!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xác nhận OTP</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        color: #333333;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        border: 5px solid #39c6b9;
                        border-radius: 10px;
                    }
                    .content {
                        padding: 20px;
                    }
                    h1 {
                        color: #39c6b9;
                    }
                    p {
                        line-height: 1.5;
                    }
                    a {
                        color: #0099ff;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <h1>Speaking English</h1>
                        <p>Xin chào, <span style="font-weight: bold;">${user?.username}</span>!</p>
                        <p>Xin vui lòng click vào đường link dưới đây để thay đổi mật khẩu của bạn.</p>
                        <p>Link này sẽ hết hạn sau 15 phút kể từ bây giờ. </p>
                        <strong style="color: #da4f25;"><a href=${process.env.URL_SERVER}/user/resetPassword/${resetToken}>Click here</a></strong>
                        <p>Cảm ơn bạn đã tin tưởng sử dụng web của chúng tôi!</p>
                        <p>Trân trọng,</p>
                        <p>D&H</p>
                    </div>
                </div>
            </body>
            </html>`;
      const data = {
        email,
        html,
      };
      const result = await sendMail("Forgot password", data);
      res.status(200).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  }

  //[PUT] /resetPassword/
  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword)
        return res
          .status(400)
          .json({ success: false, message: "Missing inputs" });

      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const user = await User.findOne({
        passwordResetToken,
        //kiểm tra xem thời gian reset Password có lớn hơn tg hiện tại ko
        // có thì mới tìm thấy user để đổi pass
        passwordResetExpires: { $gt: Date.now() },
      });
      if (!user) throw new Error("Invalid reset token");
      user.password = newPassword;
      user.passwordChangedAt = Date.now();
      user.passwordResetExpires = undefined;
      user.passwordResetToken = undefined;
      await user.save();
      res.status(200).json({
        success: user ? true : false,
        message: user ? "Updated Password" : "Something went wrong !!",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();