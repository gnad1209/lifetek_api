const https = require('https');
const axios = require('axios')

const agent = new https.Agent({
    rejectUnauthorized: false,
});

const getListRoles = async (host, access_token, clientId) => {
    const userEndpoint = `${host}?clientId=${clientId}`;
    const configRole = {
        method: 'get',
        url: userEndpoint,
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        },
        httpsAgent: agent
    };
    try {
        //lấy data list role groups
        response_role_group = await axios(configRole);
        return response_role_group.data
    } catch (error) {
        //trả về lỗi nếu ko call được api list role
        console.error('Error fetching role attributes:', error.response ? error.response.data : error.message);
        throw error;
    }
}

const getRoleAttributes = async (roleCode, accessToken) => {
    const roleEndpoint = `https://192.168.11.35:9443/scim2/v2/Roles/${roleCode}`;

    const config = {
        method: 'get',
        url: roleEndpoint,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Error fetching role attributes:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const checkClientIam = (IamClient) => {
    return new Promise(async (resolve, reject) => {
        try {
            const iamClientId = IamClient.iamClientId;
            const iamClientSecret = IamClient.iamClientSecret;
            resolve({ iamClientId: iamClientId, iamClientSecret: iamClientSecret })
        } catch (e) {
            reject(e)
        }
    })
}

function transformData(input) {
    const output = {
        res: {
            status: 1,
            _id: "663d9459a010b93bde437e4a",
            moduleCode: "IncommingDocument",
            userId: "62346aa9da4d530f61bbbefd",
            roles: [
                {
                    data: [],
                    _id: "663d9459a010b93bde437e4b",
                    code: "BUSSINES",
                    name: "Nghiệp vụ",
                    type: 1
                }
            ]
        }
    };

    input.data.Resources.forEach((resource, index) => {
        output.res.roles[0].data.push({
            _id: `663d9459a010b93bde437e${60 + index}`,
            name: resource.displayName,
            data: {
                view: true,
                set_command: false,
                free_role_to_set: false,
                department_incharge: false,
                set_complete: true
            }
        });
    });

    return output;
}

module.exports = {
    getListRoles,
    getRoleAttributes,
    checkClientIam,
    transformData
}