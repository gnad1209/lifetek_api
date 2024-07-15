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
    const roleEndpoint = `https://192.168.11.9:9443/scim2/Groups/${roleCode}`;

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
    const roleEndpoint = `https://192.168.11.9:9443/scim2/v2/Roles/${roleCode}`;

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
const convertDataList = async (roleGroup, data, access_token) => {
    // Sử dụng Promise.all để chờ tất cả các promise hoàn thành và tạo ra mảng các đối tượng với cấu trúc cần thiết từ roleGroup.data
    const infoData = await Promise.all(roleGroup.data.map(async (item) => {
        return {
            applyEmployeeOrgToModuleOrg: item.applyEmployeeOrgToModuleOrg,
            _id: item._id,
            name: item.name,
            clientId: item.clientId,
            code: item.code,
            descriptions: "",
            roles: [] // Khởi tạo mảng rỗng để lưu các roles
        };
    }));

    // Khởi tạo đối tượng convertedListRole với mảng data chứa tất cả các phần tử từ infoData
    const convertedListRole = {
        data: infoData
    };

    // Sử dụng Promise.all để xử lý các yêu cầu bất đồng bộ cho từng resource trong data.Resources
    await Promise.all(data.Resources.map(async (resource) => {
        const dataDetail = await getRoleAttributes(resource.id, access_token);
        console.log(dataDetail);
        console.log(convertedListRole.data);
        // Ánh xạ các giá trị quyền từ tiếng Việt sang tiếng Anh
        const permissionMap = {
            "xem": "view",
            "nhanvbcuaphong": "department_incharge",
            "tralai": "returnDocs",
            "batbuochoanthanh": "force_set_complete",
            "giaochidao": "set_command",
            "xinykien": "set_feedback",
            "hoanthanhxuly": "set_complete",
            "themxuly": "add_more_process",
            "chuyenxulybatky": "free_role_to_set"
        };

        // Thay đổi giá trị quyền dựa trên permissionMap
        dataDetail.permissions.forEach(permission => {
            for (let key in permissionMap) {
                if (permission.value.includes(key)) {
                    permission.value = permissionMap[key];
                    break;
                }
            }
        });

        // Tạo mảng methods từ các quyền đã được ánh xạ
        const methods = dataDetail.permissions.map(permission => ({
            _id: resource.id,
            name: permission.display,
            allow: permission.value ? true : false
        }));

        // Tạo một đối tượng role mới
        const newRole = {
            _id: dataDetail.id,
            titleFunction: dataDetail.displayName,
            codeModuleFunction: "",
            clientId: "DHVB",
            methods: methods
        };

        // Tìm phần tử trong convertedListRole.data với clientId tương ứng
        const targetData = convertedListRole.data.find(item => item.clientId === dataDetail.audience.display);
        // Nếu tìm thấy phần tử tương ứng, thêm newRole vào roles
        if (targetData) {
            targetData.roles.push(newRole);
        }
    }));

    // Trả về đối tượng convertedListRole sau khi đã xử lý xong
    return convertedListRole;
};




module.exports = {
    getListRoles,
    getRoleAttributes,
    checkClientIam,
    convertDataList,
    getGroupAttributes
}