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

const getGroupAttributes = async (roleCode, accessToken) => {
    const roleEndpoint = `https://192.168.11.35:9443/scim2/Groups/${roleCode}`;

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
const convertData = async (id, data, access_token) => {
    const convertedRole = {
        //   status: 1,
        // id: "...",
        // moduleCode: "...",
        userId: id,
        roles: [
            {
                data: [],
                _id: data.id,
                code: data.displayName,
                type: 0,
                name: data.displayName
            }
        ]
    };

    // Sử dụng map để lặp qua mảng roles với async/await
    await Promise.all(data.roles.map(async (role) => {
        const dataDetail = await getRoleAttributes(role.value, access_token);

        // Xử lý role.display
        if (role.display.includes("tiep_nhan")) {
            role.display = 'receive';
        } else if (role.display.includes("xu_ly")) {
            role.display = 'processing';
        } else if (role.display.includes("phoi_hop")) {
            role.display = 'support';
        } else if (role.display.includes("nhan_de_biet")) {
            role.display = 'view';
        } else if (role.display.includes("chi_dao")) {
            role.display = 'command';
        } else if (role.display.includes("y_kien")) {
            role.display = 'feedback';
        } else if (role.display.includes("Tra_cuu")) {
            role.display = 'findStatistics';
        }

        // Tạo object data mới
        const newData = {
            _id: role.value,
            name: role.display,
            data: {
                view: false,
                set_command: false,
                free_role_to_set: false,
                department_incharge: false,
                set_complete: false,
                returnDocs: false,
                add_more_process: false,
                force_set_complete: false,
                set_feedback: false
            }
        };

        // Thêm newData vào convertedRole
        convertedRole.roles[0].data.push(newData);

        // Xử lý permissions
        dataDetail.permissions.forEach((permission) => {
            switch (permission.value) {
                case "xem":
                    newData.data.view = true;
                    break;
                case "giao_chi_dao":
                    newData.data.set_command = true;
                    break;
                case "nhan_xu_ly_bat_ky":
                    newData.data.free_role_to_set = true;
                    break;
                case "nhan_VB_cua_phong":
                    newData.data.department_incharge = true;
                    break;
                case "hoan_thanh_xu_ly":
                    newData.data.set_complete = true;
                    break;
                case "tra_lai":
                    newData.data.returnDocs = true;
                    break;
                case "them_xu_ly":
                    newData.data.add_more_process = true;
                    break;
                case "bat_buoc_hoan_thanh":
                    newData.data.force_set_complete = true;
                    break;
                case "xin_y_kien":
                    newData.data.set_feedback = true;
                    break;
                default:
                    break;
            }
        });

        console.log(newData); // Kiểm tra newData đã được thêm vào convertedRole

        return newData; // Return newData
    }));

    // Return convertedRole sau khi đã được xử lý
    return convertedRole;
};
module.exports = {
    getListRoles,
    getRoleAttributes,
    checkClientIam,
    convertData,
    getGroupAttributes
}