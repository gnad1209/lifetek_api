const axios = require('axios');
const Log = require('./user.log.model');
const getToken = require("../../service/getToken.shareService");

const clientId = 'Zs_xuVIiO8dGeTZnP_1E3VxAUaca';
const clientSecret = 'yEEOWUiA2FHA5U3ejhsvwoWPGmJcXMxCj92JQhjtbcUa';
const host = `https://192.168.11.9`;
const USER_LIST_SCOPE = 'internal_user_mgt_list';
const USER_CREATE_SCOPE = 'internal_user_mgt_create';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const getAllUsers = async () => {
    const userEndpoint = `${host}:9443/scim2/Users`;
    const accessToken = await getToken(USER_LIST_SCOPE, clientId, clientSecret);

    try {
        const config = {
            method: 'get',
            url: userEndpoint,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Error getting users:', error);
        throw new Error('Error getting users');
    }
};
const checkUserExistence = async (userName) => {
    const userEndpoint = `${host}:9443/scim2/Users`;
    const a = await getAllUsers()
    console.log(a.Resources[2]);
    const accessToken = await getToken(USER_LIST_SCOPE, clientId, clientSecret);

    try {
        const checkUserConfig = {
            method: 'get',
            url: `${userEndpoint}?filter=userName eq ${userName}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };
        const checkUserResponse = await axios(checkUserConfig);
        return checkUserResponse.data.totalResults > 0;
    } catch (error) {
        console.error('Error checking user existence:', error);
        throw new Error('Error checking user existence');
    }
};

const createUser = async (req, res) => {
    const { body } = req;

    if (process.env.IAM_ENABLE !== "TRUE") {
        return res.json("IAM is disabled, user creation is not allowed.");
    }
    if(!clientId || !clientSecret){
        return res.json('Missing IAM config for clientId, clientSecret ');
    }
    try {
        // Kiểm tra sự tồn tại của người dùng
        const userExists = await checkUserExistence(body.userName);
        if (userExists) {
            return res.status(409).json({ message: "Username already exists" });
        }

        // Tạo người dùng mới
        const accessToken = await getToken(USER_CREATE_SCOPE, clientId, clientSecret);
        const user = {
            "schemas": [],
            "name": {
                "givenName": body.givenName,
                "familyName": body.familyName
            },
            "userName": body.userName,
            "password": body.password,
            "emails": [
                {
                    "primary": true,
                    "value": body.email, // Sửa từ body.value thành body.email nếu email được truyền vào là body.email
                    "type": body.emailType // Thêm type của email nếu cần thiết
                }
            ],
            "roles": [
                {
                    "value": body.roleValue, // Giá trị vai trò
                    "display": body.roleDisplay // Tên hiển thị vai trò
                }
            ],
            "groups": [
                {
                    "value": body.groupValue, // Giá trị nhóm
                    "display": body.groupDisplay // Tên hiển thị nhóm
                }
            ]
        };


        const userEndpoint = `${host}:9443/scim2/Users`;
        const config = {
            method: 'post',
            url: userEndpoint,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: user
        };

        const response = await axios(config);
        res.status(200).json({
            status: "success",
            data: response.data,
            message: "User created successfully"
        });

        const log = new Log({
            action: 'createUser',
            status: 'success',
            response: response.data
        });
        await log.save();
    } catch (error) {
        if (error.response && error.response.status === 409) {
            return res.status(409).json({ message: 'Username already exists', details: error.response.data });
        } else {
            return res.status(500).json({ message: 'Error creating user', details: error.response ? error.response.data : error.message });
        }
    }
};

module.exports = {
    createUser
};
