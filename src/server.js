const fetch = require('node-fetch');
global.fetch = fetch; // Polyfill for Node.js < 18
global.Headers = fetch.Headers;  // Make Headers available globally
global.Request = fetch.Request;  // Make Request available globally
global.Response = fetch.Response;  // Make Response available globally
require('dotenv').config();
const express = require('express');
const configViewEngine = require('./config/viewEngine');
const router = require('./routes/api');
const connection = require('./config/database');
const { getHomepage } = require('./controllers/homeController');
const cors = require('cors');
const checkExpiredPackages = require('./middleware/cronJobsPackage');

const app = express();
const port = process.env.PORT || 8080;

//config cors
app.use(cors({
    origin: 'http://localhost:3000', // Cho phép yêu cầu từ frontend React
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],       // Chỉ định các phương thức được phép
    credentials: true               // Nếu bạn cần gửi cookie hoặc xác thực
  }));

//config req.body
app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true })) // for form data

//config template engine
configViewEngine(app);

const webAPI = express.Router();
webAPI.get("/", getHomepage);

//khai báo route
app.use('/', webAPI);

app.use('/v1/api/', router);


(async () => {
    try {
        //using mongoose
        await connection();

        checkExpiredPackages();
        
        app.listen(port, () => {
            console.log(`Backend Nodejs App listening on port ${port}`)
        })
    } catch (error) {
        console.log(">>> Error connect to DB: ", error)
    }
})()
