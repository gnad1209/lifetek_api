require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.DATABASE_ROLE_DEPARTMENT || `mongodb://127.0.0.1:27017/db`

// const uri = process.env.DATABASE_ROLE_DEPARTMENT || `mongodb+srv://t6ngl4m:ROO29Mj8bo9011ly@mxhtm0xx.vw82yvp.mongodb.net/?retryWrites=true&w=majority&appName=MxHTM0xx`;

const connection = mongoose.createConnection(uri);

connection.on('connected', () => {
    console.log('Kết nối tới cơ sở dữ liệu MongoDB thành công.');
});

connection.on('error', (err) => {
    console.error('Lỗi khi kết nối tới cơ sở dữ liệu MongoDB:', err);
});

connection.on('disconnected', () => {
    console.log('Đã ngắt kết nối từ cơ sở dữ liệu MongoDB.');
});

module.exports = connection;
