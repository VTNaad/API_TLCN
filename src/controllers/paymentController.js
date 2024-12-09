const moment = require('moment');
const axios = require("axios");
const crypto = require('crypto');
const config = require('../config/vnpay.json');
const qs = require('qs');
const sortObject = require('../util/sortObject');

class PaymentController {
    async createPaymentUrl(req, res) {
        try {
            process.env.TZ = 'Asia/Ho_Chi_Minh';
            let date = new Date();
            let createDate = moment(date).format('YYYYMMDDHHmmss');
            let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            let tmnCode = config.vnp_TmnCode;
            let secretKey = config.vnp_HashSecret;
            let vnpUrl = config.vnp_Url;
            let returnUrl = config.vnp_ReturnUrl;
            let orderId = moment(date).format('DDHHmmss');
            let { amount, bankCode, language } = req.body;

            let currCode = 'VND';
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = tmnCode;
            vnp_Params['vnp_Locale'] = language || 'vn';
            vnp_Params['vnp_CurrCode'] = currCode;
            vnp_Params['vnp_TxnRef'] = orderId;
            vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
            vnp_Params['vnp_OrderType'] = 'other';
            vnp_Params['vnp_Amount'] = amount * 100;
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;
            if(bankCode !== null && bankCode !== ''){
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            vnp_Params = sortObject(vnp_Params);
            let signData = qs.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac('sha512', secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
            vnp_Params['vnp_SecureHash'] = signed;

            vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });
            console.log(vnpUrl);
            // res.redirect(vnpUrl);
            res.json({ url: vnpUrl });
        } catch (error) {
            console.error('Error in createPaymentUrl:', error);
            res.status(500).json({ message: 'Create Payment Failed' });
        }
    }

    async vnpayReturn(req, res) {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = sortObject(vnp_Params);
            let secretKey = config.vnp_HashSecret;
            let signData = qs.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac('sha512', secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

            if (secureHash === signed) {
                res.render('success', { code: vnp_Params['vnp_ResponseCode'] });
            } else {
                res.render('success', { code: '97' });
            }
        } catch (error) {
            console.error('Error in vnpayReturn:', error);
            res.status(500).json({ message: 'Error Payment Return' });
        }
    }

    async vnpayIpn(req, res) {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];
            let rspCode = vnp_Params['vnp_ResponseCode'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = sortObject(vnp_Params);
            let secretKey = config.vnp_HashSecret;
            let signData = qs.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac('sha512', secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

            let paymentStatus = '0'; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
            //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
            //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

            let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
            let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn

            if(secureHash === signed){ //kiểm tra checksum
                if(checkOrderId){
                    if(checkAmount){
                        if(paymentStatus=="0"){ //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
                            if(rspCode=="00"){
                                //thanh cong
                                //paymentStatus = '1'
                                // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
                                // res.status(200).json({RspCode: '00', Message: 'Success'})
                                return res.redirect(
                                    // `http://localhost:3000/payment-success?transactionId=${vnp_Params['vnp_TransactionNo']}`
                                    `http://localhost:3000/payment-success`
                                );
                            }
                            else {
                                //that bai
                                //paymentStatus = '2'
                                // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
                                res.status(200).json({RspCode: '00', Message: 'Success'})
                            }
                        }
                        else{
                            res.status(200).json({RspCode: '02', Message: 'This order has been updated to the payment status'})
                        }
                    }
                    else{
                        res.status(200).json({RspCode: '04', Message: 'Amount invalid'})
                    }
                }       
                else {
                    res.status(200).json({RspCode: '01', Message: 'Order not found'})
                }
            }
            else {
                res.status(200).json({RspCode: '97', Message: 'Checksum failed'})
            }
        } catch (error) {
            console.error('Error in vnpayIpn:', error);
            res.status(500).json({ message: 'Error IPN' });
        }
    }

    async queryTransaction(req, res) {
        try {
            const { orderId, transDate } = req.body;

            if (!orderId || !transDate) {
                return res.status(400).json({ message: 'OrderId and TransDate cannot empty' });
            }

            process.env.TZ = 'Asia/Ho_Chi_Minh';
            const date = new Date();

            let vnp_TmnCode = config.vnp_TmnCode;
            let secretKey = config.vnp_HashSecret;
            let vnp_Api = config.vnp_Api;

            let vnp_RequestId = moment(date).format('HHmmss');
            let vnp_Version = '2.1.0';
            let vnp_Command = 'querydr';
            let vnp_OrderInfo = 'Truy van GD ma:' + orderId;
            let vnp_IpAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
            let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TxnRef + "|" + vnp_TransactionDate + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;

            let hmac = crypto.createHmac('sha512', secretKey);
            let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest('hex');

            let dataObj = {
                'vnp_RequestId': vnp_RequestId,
                'vnp_Version': vnp_Version,
                'vnp_Command': vnp_Command,
                'vnp_TmnCode': vnp_TmnCode,
                'vnp_TxnRef': vnp_TxnRef,
                'vnp_OrderInfo': vnp_OrderInfo,
                'vnp_TransactionDate': transDate,
                'vnp_CreateDate': vnp_CreateDate,
                'vnp_IpAddr': vnp_IpAddr,
                'vnp_SecureHash': vnp_SecureHash
            };

            const response = await axios.post(vnp_Api, dataObj, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            res.status(200).json({
                success: true,
                data: response,
            });
        } catch (error) {
            console.error('Error in queryTransaction:', error);
            res.status(500).json({
                success: false,
                message: 'An error Query Transaction',
            });
        }
    }

    async refundTransaction(req, res) {
        try {
            const { orderId, transDate, amount, transType, user } = req.body;

            if (!orderId || !transDate || !amount || !transType || !user) {
                return res.status(400).json({ message: 'All fields cannot empty' });
            }

            process.env.TZ = 'Asia/Ho_Chi_Minh';
            let date = new Date();

            let vnp_TmnCode = config.vnp_TmnCode;
            let secretKey = config.vnp_HashSecret;
            let vnp_Api = config.vnp_Api;

            let vnp_RequestId = moment(date).format('HHmmss');
            let vnp_Version = '2.1.0';
            let vnp_Command = 'refund';
            let vnp_OrderInfo = 'Hoan tien GD ma:' + orderId;
            let vnp_IpAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
            let vnp_TransactionNo = '0';
            let vnp_Amount = amount * 100;

            let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + transType + "|" + orderId + "|" + vnp_Amount + "|" + vnp_TransactionNo + "|" + transDate + "|" + user + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;

            let hmac = crypto.createHmac('sha512', secretKey);
            let vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

            let dataObj = {
                'vnp_RequestId': vnp_RequestId,
                'vnp_Version': vnp_Version,
                'vnp_Command': vnp_Command,
                'vnp_TmnCode': vnp_TmnCode,
                'vnp_TransactionType': transType,
                'vnp_TxnRef': orderId,
                'vnp_Amount': vnp_Amount,
                'vnp_TransactionNo': vnp_TransactionNo,
                'vnp_CreateBy': user,
                'vnp_OrderInfo': vnp_OrderInfo,
                'vnp_TransactionDate': transDate,
                'vnp_CreateDate': vnp_CreateDate,
                'vnp_IpAddr': vnp_IpAddr,
                'vnp_SecureHash': vnp_SecureHash
            };

            const response = await axios.post(vnp_Api, dataObj, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            res.status(200).json({
                success: true,
                data: response,
            });
        } catch (error) {
            console.error('Error in refundTransaction:', error);
            res.status(500).json({
                success: false,
                message: 'An error Refund Transaction',
            });
        }
    }
}

module.exports = new PaymentController();
