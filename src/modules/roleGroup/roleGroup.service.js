const https = require('https');
const axios = require('axios')
const { permissionMap, setData, methodsDataList, rowDataDetails,columnsDataDetails, combinedPermissions } = require("./roleGroup.config")

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

    try {
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
            try {
                const dataDetail = await getRoleAttributes(resource.id, access_token);
                // Ánh xạ các giá trị quyền 

                // Thay đổi giá trị quyền dựa trên permissionMap
                dataDetail.permissions.forEach(permission => {
                    for (let key in permissionMap) {
                        if (permission.value.includes(key)) {
                            permission.value = permissionMap[key];
                            break;
                        }
                    }
                });

                // Tạo mảng methods từ methodsDataList của config
                const methods = methodsDataList(resource);

                // Cập nhật giá trị allow của methods dựa trên permissions
                dataDetail.permissions.forEach(permission => {
                    const method = methods.find(m => m.name === permission.value);
                    if (method) {
                        method.allow = true;
                    }
                });

                // Tạo một đối tượng role mới
                const newRole = {
                    _id: dataDetail.id,
                    titleFunction: dataDetail.displayName,
                    codeModuleFunction: "",
                    clientId: "DHVB",
                    methods: methods
                };

                // Ánh xạ role vào targetData phù hợp
                convertedListRole.data.forEach(targetData => {
                    // Lấy phần tử titleFunction và chuyển thành chữ thường
                    const titleFunction = dataDetail.displayName.toLowerCase();
                    // Xác định phần tử data mục tiêu dựa trên các điều kiện
                    if (titleFunction.includes('_tp') && targetData.code === 'TRUONGPHONG') {
                        targetData.roles.push(newRole);
                    } else if (titleFunction.includes('_ptp') && targetData.code === 'PHOTRUONGPHONG') {
                        targetData.roles.push(newRole);
                    } else if (titleFunction.includes('_pgd') && targetData.code === 'PHOGIAMDOC') {
                        targetData.roles.push(newRole);
                    } else if (titleFunction.includes('_gd') && targetData.code === 'GIAMDOC') {
                        targetData.roles.push(newRole);
                    } else if (titleFunction.includes('_cb') && targetData.code === 'CANBO') {
                        targetData.roles.push(newRole);
                    }
                });

            } catch (resourceError) {
                console.error(`Error processing resource with id ${resource.id}:`, resourceError);
            }
        }));

        // Trả về đối tượng convertedListRole sau khi đã xử lý xong
        return convertedListRole;

    } catch (error) {
        console.error('Error converting data list:', error);
        throw error; // Nếu muốn ném lỗi ra ngoài để xử lý tiếp, nếu không có thể bỏ dòng này.
    }
};

const convertDataDetails = async (id, data, token_group, token_role, token_user) => {
    const convertedRole = {
        status: 1,
        id: data.id,
        moduleCode: data.displayName,
        userId: "",
        roles: [],
        __v: 0,

    };
    let typeCounter = 0;

    await Promise.all(data.groups.map(async (group) => {
        const detailGroup = await getGroupAttributes(group.value, token_group);
        const newRole = {
            column: combinedPermissions,
            row: rowDataDetails,
            data: [],
            _id: group.value,
            code: group.display,
            type: typeCounter,
            name: group.display
        };
        convertedRole.roles.push(newRole);
        typeCounter++;

        await Promise.all(detailGroup.roles.map(async (role) => {
            const detailRole = await getRoleAttributes(role.value, token_role);
            // Xử lý role.display
            if (role.display.includes("Tiepnhan")) {
                role.display = 'receive';
            } else if (role.display.includes("Xuly")) {
                role.display = 'processing';
            } else if (role.display.includes("Phoihop")) {
                role.display = 'support';
            } else if (role.display.includes("Nhandebiet")) {
                role.display = 'view';
            } else if (role.display.includes("Chidao")) {
                role.display = 'command';
            } else if (role.display.includes("Ykien")) {
                role.display = 'feedback';
            } else if (role.display.includes("Tracuu")) {
                role.display = 'findStatistics';
            }

            // Tạo object data mới
            const newData = {
                _id: role.value,
                name: role.display,
                data: {
                    setData
                }
            };

            // Thêm newData vào newRole
            newRole.data.push(newData);

            // Xử lý permissions

            detailRole.permissions.forEach((permission) => {
                for (const [key, value] of Object.entries(permissionMap)) {
                    if (permission.value.includes(key)) {
                        newData.data[value] = true;
                        break; // Chúng ta có thể dừng lại nếu đã tìm thấy
                    }
                }
            });
            return newData;
        }));

        return newRole;
    }));

    return convertedRole;
};

module.exports = {
    getListRoles,
    getRoleAttributes,
    checkClientIam,
    convertDataList,
    convertDataDetails,
    getGroupAttributes
}