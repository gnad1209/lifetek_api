const mongoose = require('mongoose');
const uri = process.env.DATABASE_ROLE_DEPARTMENT || `mongodb+srv://t6ngl4m:ROO29Mj8bo9011ly@mxhtm0xx.vw82yvp.mongodb.net/?retryWrites=true&w=majority&appName=MxHTM0xx`

module.exports = mongoose.createConnection(uri);
