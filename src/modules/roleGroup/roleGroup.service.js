const https = require('https');
const axios = require('axios');
const jsonDataCodeModule = require('./ex_listRole.json');
const jsonDataAttributes = require('./ex_detailRole.json');
const dotenv = require('dotenv');
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
        responseRoleGroup = await axios(configRole);
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
    return new Promise(async (resolve, reject) => {
        try {
            const iamClientId = iamClient.iamClientId;
            const iamClientSecret = iamClient.iamClientSecret;
            resolve({ iamClientId: iamClientId, iamClientSecret: iamClientSecret });
        } catch (e) {
            reject(e);
        }
    })
}
const convertDataList = async (dataDb, dataApi, accessToken) => {
    //data trong db
    const convertedRole = dataDb;
    const newRoles = [];

    // Sử dụng map để lặp qua mảng Resources với async/awaitzz
    await Promise.all(dataApi.Resources.map(async (role) => {
        const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, accessToken);
        //khởi tạo biến đếm cho mỗi bản ghi
        let typeCounter = 0;
        //đổi value clientId
        jsonDataAttributes.configRow.map((jsonData) => {
            if (role.displayName.includes(jsonData.title))
                role.displayName = jsonData.name;
        })
        // Tạo object data mới
        const newData = [{
            _id: role.id,
            titleFunction: '',
            codeModleFunction: dataDetailRole.displayName,
            clientId: role.displayName,
            methods: []
        }];
        typeCounter++;
        //kiểm tra có codemodule trong file config ko và lặp để thêm các method vào newData nếu có codemodule tương tự db thì convert
        if (!jsonDataCodeModule[role.displayName]) {
            return newRoles;
        }
        jsonDataCodeModule[role.displayName].map((jsonData) => {
            const methods = {
                name: jsonData.name,
                allow: false
            };
            newData[0].methods.push(methods);
            //config lại tên của permission, xét giá trị cho chúng có tồn tại ko
            dataDetailRole.permissions.forEach((permission) => {
                if (permission.value.includes(jsonData.title))
                    permission.value = jsonData.name;
                newData.forEach((n) => {
                    n.methods.forEach((method) => {
                        if (method.name === permission.value)
                            method.allow = true;
                    });
                });
            });
        });
        newRoles.push(newData);
        return newRoles;
        // Return newData
    }));
    //kiểm tra ko có dữ liệu mới thì trả về dữ liệu trong db
    if (newRoles.length === 0) {
        return convertedRole;
    }
    convertedRole.data.forEach((a) => {
        a.roles.forEach((role) => {
            newRoles.forEach((newRole) => {
                // console.log(newRole)
                newRole.forEach((n) => {
                    //DK1-2: ROLE codeModleFnc giống role trong db DK3-4: dữ liệu trong wso2 có GROUPS trùng với groups trong db 
                    if (n.codeModleFunction.includes(role.codeModleFunction) && n.codeModleFunction[a.code.length + 1] == role.codeModleFunction[0] && n.codeModleFunction.includes(a.code) && n.codeModleFunction[0] === a.code[0]) {
                        console.log('zo day')
                        role.methods = n.methods;
                    }
                });
            });
        });
    });
    return convertedRole;
}

const convertData = async (id, data, tokenGroup, tokenRole, tokenResources) => {
    //đang test
    // const resources = await getList('https://192.168.11.35:9443/api/server/v1/api-resources', token_resources)
    // resources.apiResources.map((apiResource) => {
    //     // if (apiResource.name === 'User')
    //     console.log(apiResource.name)
    // })

    //biến convert 
    const convertedRole = {
        status: 1,
        id: data.roles[0].audienceValue,
        moduleCode: "IncommingDocument",
        userId: id,
        roles: [],
        __v: 0,
        createdAt: data.meta.created,
        updatedAt: data.meta.lastModified
    };
    const key = Object.keys(jsonDataCodeModule);
    //biến đọc số bản ghi role
    let typeCounter = 0;
    if (!key.includes(convertedRole.moduleCode)) {
        return convertedRole;
    }
    await Promise.all(data.groups.map(async (group) => {
        //lấy dữ liệu chi tiết groups trong wso2 
        const detailGroup = await getAttributes(group.value, process.env.HOST_GROUPS, tokenGroup);
        const newRole = {
            column: [],
            row: [],
            data: [],
            _id: group.value,
            code: group.display,
            type: typeCounter,
            name: group.display
        };
        newRole.column = jsonDataAttributes.column;
        newRole.row = jsonDataAttributes.row;
        convertedRole.roles.push(newRole);
        typeCounter++;

        await Promise.all(detailGroup.roles.map(async (role) => {
            //lấy chi tiết dữ liệu của role trong wso2
            const detailRole = await getAttributes(role.value, process.env.HOST_DETAIL_ROLES, tokenRole);
            jsonDataAttributes.configRow.map((jsonData) => {
                if (role.display.includes(jsonData.title))
                    role.display = jsonData.name;
            })
            // Tạo object data mới
            const newData = {
                _id: role.value,
                name: role.display,
                data: {}
            };
            //mapping tên trong wso2 ra ngoài
            //config lại tên của permission, xét giá trị cho chúng có tồn tại ko
            jsonDataAttributes.configRow.map((jsonData) => {
                if (role.display.includes(jsonData.title))
                    role.display = jsonData.name;
            })
            // sửa dữ liệu các chức năng của role
            jsonDataCodeModule[convertedRole.moduleCode].map((jsonData) => {
                newData.data[jsonData.name] = false;
                detailRole.permissions.forEach((permission) => {
                    if (permission.value.includes(jsonData.title))
                        newData.data[jsonData.name] = true;
                });
            });
            newRole.data.push(newData);
        }));
    }));
    return convertedRole;
};

module.exports = {
    getList,
    checkClientIam,
    convertData,
    getAttributes,
    convertDataList,
}