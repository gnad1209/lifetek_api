const mongoose = require('mongoose');
const conn = require('../../config/appConn');
const mongoURI = 'mongodb://username:password@host:port/database';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000 // 30 giây
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Định nghĩa schema và model của bạn ở đây
const Schema = mongoose.Schema;

const roleSchema = new Schema({
    audienceValue: { type: String,default:"" },
    display: { type: String,default:"" },
    audienceType: { type: String,default:"" },
    value: { type: String,default:"" },
    $ref: { type: String,default:"" },
    audienceDisplay: { type: String,default:"" }
});

const metaSchema = new Schema({
    created: { type: Date,default:"" },
    location: { type: String,default:"" },
    lastModified: { type: Date,default:"" },
    resourceType: { type: String,default:"" }
});

const userSchema = new Schema({
    status: { type: String,default:"" },
    data: {
        meta: metaSchema,
        schemas: { type: [String],default:"" },
        roles: { type: [roleSchema],default:"" },
        id: { type: String,default:"" },
        userName: { type: String }
    },
    message: { type: String,default:"" }
});

const User = conn.model('User', userSchema);

module.exports = User;
