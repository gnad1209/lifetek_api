const https = require('https');
const axios = require('axios');
const jsonDataCodeModule = require('./ex_listRole.json');
const jsonDataAttributes = require('./ex_detailRole.json');
const dotenv = require('dotenv');
const { resolve } = require('path');
dotenv.config();
const agent = new https.Agent({
    rejectUnauthorized: false,
});

const getList = async (host, accessToken, clientId) => {
    const userEndpoint = `${host}?clientId=${clientId}`;
    const configRole = {
        method: 'get',
        url: userEndpoint,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        httpsAgent: agent
    };
    try {
        //lấy data list role groups
        const responseRoleGroup = await axios(configRole);
        return responseRoleGroup.data
    } catch (error) {
        //trả về lỗi nếu ko call được api list role
        console.error('Error fetching role attributes:', error.response ? error.response.data : error.message);
        throw error;
    }
}

const getAttributes = async (userId, host, accessToken) => {
    const roleEndpoint = `${host}/${userId}`;

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

const checkClientIam = (iamClient) => {
    try {
        const iamClientId = iamClient.iamClientId;
        const iamClientSecret = iamClient.iamClientSecret;
        return ({ iamClientId: iamClientId, iamClientSecret: iamClientSecret });
    } catch (e) {
        throw e;
    }
}

const changeDisplayNameDetailRole = (arr, name) => {
    try {
        //config tên theo file config có sẵn
        arr.forEach((data) => {
            if (name.includes(data.title)) {
                name = data.name;
            }
        });
        return name;
    } catch (e) {
        throw e;
    }
}

const changeDisplayNameRoleGroups = (arr, name) => {
    try {
        //config tên theo file config có sẵn
        arr.forEach((data) => {
            if (name.includes(data.title)) {
                name = data.name;
            }
        });
        return name;
    } catch (e) {
        throw e;
    }
}

const createMethodsInDataDetailRole = (codeModle, permissionRole, newData) => {
    try {
        if (!Array.isArray(codeModle)) {
            throw new Error('codeModle trong convertedDetailRole không phải là 1 mảng');
        };
        codeModle.forEach((jsonData) => {

            //lỗi file config ko có tên
            if (!jsonData.name) {
                return ({ mgs: "file config không có name của role" });
            };
            const methods = {
                name: jsonData.name,
                allow: false
            };
            newData[0].methods.push(methods);
            // Cập nhật tên của các quyền và đặt allow thành true nếu khớp
            // const permission = changeDisplayName(dataDetailRole.permissions, permission.value);
            const respone = configMethodsInDataDetailRole(permissionRole, jsonData, newData);
            return respone;
        });
    } catch (e) {
        throw e;
    };
};

const configMethodsInDataDetailRole = (permissionRole, jsonData, newData) => {
    try {
        if (!Array.isArray(permissionRole)) {
            throw new Error('permissionRole trong convertedRole không phải là 1 mảng');
        };
        if (!jsonData) {
            throw new Error('không có sẵn config cho dữ liệu')
        }
        if (!Array.isArray(newData)) {
            throw new Error('newData không phải là 1 mảng');
        };
        permissionRole.forEach((permission) => {
            if (permission.value.includes(jsonData.title)) {
                permission.value = jsonData.name;
            };
            newData.forEach((n) => {
                n.methods.forEach((method) => {
                    if (method.name === permission.value) {
                        method.allow = true;
                    };
                });
            });
        });
    } catch (err) {
        throw err;
    };
};

const changeMethodsInDataDetailRole = (convertedRole, newRoles) => {
    try {
        convertedRole.forEach((a) => {
            if (!Array.isArray(a.roles)) {
                throw new Error('roles trong convertedRole không phải là 1 mảng');
            };
            a.roles.forEach((role) => {
                newRoles.forEach((newRole) => {
                    if (!Array.isArray(newRole)) {
                        throw new Error('newRole trong newRoles không phải là 1 mảng');
                    }
                    newRole.forEach((n) => {
                        if (n.codeModleFunction.includes(role.codeModleFunction) &&
                            n.codeModleFunction.includes(a.code) &&
                            n.codeModleFunction[a.code.length + 1] === role.codeModleFunction[0] &&
                            n.codeModleFunction[0] === a.code[0]) {
                            role.methods = n.methods;
                        };
                    });
                });
            });
        });
    } catch (e) {
        throw e;
    }
};


const convertDataList = async (dataDb, dataApi, accessToken) => {
    try {
        const convertedRole = dataDb;
        const newRoles = [];
        const resourcesApi = dataApi.Resources;
        const configRow = jsonDataAttributes.configRow;
        const convertedRoleData = convertedRole?.data;
        if (!convertedRole?.data) {
            throw new Error('dữ liệu db không tồn tại');
        }
        if (!Array.isArray(resourcesApi)) {
            throw new Error('resources không phải là 1 mảng');
        }
        await Promise.all(resourcesApi.map(async (role) => {
            //không có role cần tìm trả về data cũ
            if (!role.id) {
                return convertedRole;
            }
            const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, accessToken);
            const displayName = changeDisplayNameRoleGroups(configRow, role.displayName);
            const codeModle = jsonDataCodeModule[displayName];
            const permissionRole = dataDetailRole.permissions;
            if (!dataDetailRole) {
                throw new Error(`không tìm được bản ghi có id: ${role.id}`);
            }
            if (!dataDetailRole.displayName) {
                throw new Error(`không có displayName`);
            }
            if (!codeModle) {
                throw new Error(`file config không tìm thấy module: ${displayName}`);
            }
            if (!Array.isArray(permissionRole)) {
                throw new Error('rolePermission không phải là 1 mảng');
            }
            const newData = [{
                _id: role.id,
                codeModleFunction: dataDetailRole.displayName,
                clientId: displayName,
                methods: []
            }];
            // Thay đổi tên hiển thị dựa trên thuộc tính dữ liệu json
            createMethodsInDataDetailRole(codeModle, permissionRole, newData);
            newRoles.push(newData);
            return newRoles;
        }));

        // Nếu không có dữ liệu mới, hãy trả lại vai trò đã chuyển đổi ban đầu
        if (newRoles.length === 0) {
            return convertedRole;
        };

        // Cập nhật ConvertedRole với các phương thức từ newRoles
        changeMethodsInDataDetailRole(convertedRoleData, newRoles);

        return convertedRole;
    } catch (e) {
        throw e;
    };
};

const configNewDataInDetailRole = (detailRolePermission, codeModule, newData) => {
    try {
        if (!Array.isArray(detailRolePermission)) {
            throw new Error('detailRolePermission không phải là 1 mảng');
        }
        if (!Array.isArray(codeModule)) {
            throw new Error('codeModule không phải là 1 mảng');
        }
        //config giá trị của newData trong convertData
        codeModule.forEach((jsonData) => {
            newData.data[jsonData.name] = false;
            detailRolePermission.forEach((permission) => {
                if (permission.value.includes(jsonData.title)) {
                    newData.data[jsonData.name] = true;
                };
            });
        });
        return newData;
    } catch (e) {
        throw e;
    };
};

const changeNewRoleInDetailRole = async (detailGroup, codeModule, newRole, tokenRole, convertedRole) => {
    try {
        const configRow = jsonDataAttributes.configRow;
        await Promise.all(detailGroup.map(async (role) => {
            //lấy chi tiết dữ liệu của role trong wso2
            const detailRole = await getAttributes(role.value, process.env.HOST_DETAIL_ROLES, tokenRole);
            if (!detailRole) {
                throw new Error('không tìm được chi tiết role');
            }
            //mapping tên trong wso2 ra ngoài
            //config lại tên của permission, xét giá trị cho chúng có tồn tại ko
            const name = await changeDisplayNameDetailRole(configRow, role.display);
            if (!name) {
                throw new Error('ko có tên role trong file config');
            }
            const newData = {
                _id: role.value,
                name: name,
                data: {}
            };
            const detailRolePermission = detailRole.permissions;
            await configNewDataInDetailRole(detailRolePermission, codeModule, newData);
            // sửa dữ liệu các chức năng của role
            newRole.data.push(newData);
            if (!role.audienceValue) {
                throw new Error('không có id của app');
            }
            convertedRole.id = role.audienceValue;
            return role.audienceValue;
        }));
    } catch (e) {
        throw e;
    };
};

const convertDataDetailRole = async (id, data, tokenGroup, tokenRole, tokenResources) => {
    //đang test
    try {
        if (!data) {
            throw new Error('không tìm thấy data user');
        }
        if (!data.roles[0].audienceValue) {
            throw new Error('không tìm thấy data user');
        }
        const convertedRole = {
            status: 1,
            id: '',
            moduleCode: 'IncommingDocument',
            userId: id,
            roles: [],
            __v: 0,
            createdAt: data.meta.created,
            updatedAt: data.meta.lastModified
        };

        const key = Object.keys(jsonDataCodeModule);
        let typeCounter = 0;

        if (!key.includes(convertedRole.moduleCode)) {
            return convertedRole;
        }
        if (!Array.isArray(data.groups)) {
            throw new Error('data.groups không phải là 1 mảng');
        }

        await Promise.all(data.groups.map(async (group) => {
            //lấy dữ liệu chi tiết groups trong wso2 
            const detailGroup = await getAttributes(group.value, process.env.HOST_GROUPS, tokenGroup);
            if (!detailGroup) {
                throw new Error('không tìm tìm được chi tiết group');
            }
            if (!jsonDataAttributes.column) {
                throw new Error('không có config cho loại chức năng này');
            }
            if (!jsonDataAttributes.row) {
                throw new Error('không có config cho các vai trò này');
            }
            const newRole = {
                column: jsonDataAttributes.column,
                row: jsonDataAttributes.row,
                data: [],
                _id: group.value,
                code: group.display,
                type: typeCounter,
                name: group.display
            };
            convertedRole.roles.push(newRole);
            typeCounter++;
            const codeModule = jsonDataCodeModule[convertedRole.moduleCode];
            if (!detailGroup.roles) {
                throw new Error(`không tìm được role của groups: ${group.display}`);
            }
            await changeNewRoleInDetailRole(detailGroup.roles, codeModule, newRole, tokenRole, convertedRole);
        }));
        return convertedRole;
    } catch (e) {
        throw e;
    };
};

module.exports = {
    getList,
    checkClientIam,
    convertDataDetailRole,
    getAttributes,
    convertDataList,
}