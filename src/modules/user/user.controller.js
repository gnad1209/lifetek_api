const axios = require('axios');
const Log = require('./user.log.model');
const User = require('./user.model');
const Client = require('../../model/client.shareModel');
const getToken = require("../../service/getToken.shareService");
const clientId = 'F71GS9fzJUpwfgAyVcb8iBndQWEa';
const clientSecret = 'cEfVp17FnyLBEIfv5JLs75n2EZA1yAK2KNCU8ffJwaIa';
const host = `https://192.168.11.9`;
const USER_CREATE_SCOPE = 'internal_user_mgt_create';
const USED_SCOPE = USER_CREATE_SCOPE;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 1;

const createUser = async (req, res) => {
    // Địa chỉ endpoint của API để tạo người dùng
    const userEndpoint = `${host}:9443/t/carbon.super/console`;

    // Lấy thông tin từ body của request
    const { body } = req;

    // Tìm thông tin IAM từ database dựa trên clientId và clientSecret
    const iam = await Client.findOne({ iamClientId: clientId, iamClientSecret: clientSecret });

    // Kiểm tra nếu IAM không được bật
    if (process.env.IAM_ENABLE !== "TRUE") {
        return res.json("IAM is disabled, user creation is not allowed.");
    }

    // Kiểm tra nếu không tìm thấy cấu hình IAM
    if (!iam) {
        return res.json('Missing IAM config for clientId, clientSecret ');
    }
    //Kiểm tra user đã tồn tại hay chưa
    const userValid = await User.findOne({ "data.userName": body.userName });
    // Lấy access token từ IAM
    const accessToken = await getToken(USED_SCOPE, iam.iamClientId, iam.iamClientSecret);
    // Nếu user tồn tại thì return
    if (userValid) {
        return res.json("Username is exists")
    }
    // Tạo đối tượng người dùng với thông tin từ body của request
    const user = {
        "schemas": [],
        "name": {
            "familyName": body.familyName,
            "givenName": body.givenName
        },
        "userName": body.userName,
        "password": body.password,
        "emails": [
            {
                "primary": true,
                "value": body.value,
                "type": body.type
            }
        ],
        "data": {
            "userName": body.userName,
        }
    };
    await new User(user).save()
    // Cấu hình cho yêu cầu HTTP POST để tạo người dùng
    const config = {
        method: 'post',
        url: userEndpoint,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        data: user
    };

    try {
        // Gửi yêu cầu tạo người dùng
        const response = await axios(config);

        // Trả về phản hồi thành công nếu người dùng được tạo thành công
        res.status(200).json({
            status: "success",
            data: response.data,
            message: "User created successfully"
        });

        // Ghi log cho hành động tạo người dùng thành công
        const log = new Log({
            action: 'createUser',
            status: 'success',
            response: response.data
        });
        await log.save();
        return;
    } catch (error) {
        // Xử lý lỗi nếu có xảy ra
        if (error.response && error.response.status === 403) {
            return res.json('There is no authority to make the request:', error.response.data);
        } else {
            return res.json('Error creating user:', error.response ? error.response.data : error.message);
        }
    };
};

module.exports = {
    createUser
};