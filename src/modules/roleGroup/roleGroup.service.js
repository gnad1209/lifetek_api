const https = require('https');
const axios = require('axios')
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const dotenv = require('dotenv');
dotenv.config()
const agent = new https.Agent({
    rejectUnauthorized: false,
});

async function readJsonFile(filePath) {
    try {
        const data = await readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error('Error reading file:', err);
        return null;
    }
}

let jsonDataArray = [];
let jsonDataArrayDetail = [];

const getList = async (host, access_token, clientId) => {
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
const convertDataList = async (data_db, data_api, access_token) => {
    //data trong db
    const convertedRole = data_db;
    const newRoles = [];
    //đọc file json
    const filePathList = 'src/modules/roleGroup/ex_listRole.json';
    const filePath = 'src/modules/roleGroup/ex_detailRole.json';
    const jsonDataList = await readJsonFile(filePathList);
    const jsonData = await readJsonFile(filePath);
    if (jsonDataList) {
        jsonDataArray = jsonDataList;
        jsonDataArrayDetail = jsonData;
    }

    // Sử dụng map để lặp qua mảng Resources với async/awaitzz
    await Promise.all(data_api.Resources.map(async (role) => {
        const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, access_token);
        //khởi tạo biến đếm cho mỗi bản ghi
        let typeCounter = 0;
        //đổi value clientId
        jsonDataArrayDetail.config_row.map((jsonData) => {
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
        if (jsonDataArray[role.displayName]) {
            jsonDataArray[role.displayName].map((jsonData) => {
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
        }
        else {
            return newRoles;
        }
        // Return newData
        // console.log(newData)
    }));
    //kiểm tra ko có dữ liệu mới thì trả về dữ liệu trong db
    if (newRoles) {
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
    else {
        return convertedRole;
    };
}

const convertData = async (id, data, token_group, token_role, token_resources) => {
    //đang test
    // const resources = await getList('https://192.168.11.35:9443/api/server/v1/api-resources', token_resources)
    // resources.apiResources.map((apiResource) => {
    //     // if (apiResource.name === 'User')
    //     console.log(apiResource.name)
    // })

    //đọc file json
    const filePathList = 'src/modules/roleGroup/ex_listRole.json';
    const filePath = 'src/modules/roleGroup/ex_detailRole.json';
    const jsonDataList = await readJsonFile(filePathList);
    const jsonData = await readJsonFile(filePath);
    if (jsonDataList) {
        jsonDataArray = jsonDataList;
        jsonDataArrayDetail = jsonData;
    }
    //biến convert 
    const convertedRole = {
        status: 1,
        id: data.roles[0].audienceValue,
        moduleCode: 'IncommingDocument',
        userId: id,
        roles: [],
        __v: 0,
        createdAt: data.meta.created,
        updatedAt: data.meta.lastModified
    };
    //biến đọc số bản ghi role
    let typeCounter = 0;
    if (convertedRole.moduleCode == "IncommingDocument") {
        await Promise.all(data.groups.map(async (group) => {
            //lấy dữ liệu chi tiết groups trong wso2 
            const detailGroup = await getAttributes(group.value, process.env.HOST_GROUPS, token_group);
            const newRole = {
                column: [],
                row: [],
                data: [],
                _id: group.value,
                code: group.display,
                type: typeCounter,
                name: group.display
            };
            newRole.column = jsonDataArrayDetail.column;
            newRole.row = jsonDataArrayDetail.row;
            convertedRole.roles.push(newRole);
            typeCounter++;

            await Promise.all(detailGroup.roles.map(async (role) => {
                //lấy chi tiết dữ liệu của role trong wso2
                const detailRole = await getAttributes(role.value, process.env.HOST_DETAIL_ROLES, token_role);
                jsonDataArrayDetail.config_row.map((jsonData) => {
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
                await jsonDataArrayDetail.config_row.map((jsonData) => {
                    if (role.display.includes(jsonData.title))
                        role.display = jsonData.name;
                })
                // sửa dữ liệu các chức năng của role
                jsonDataArray.IncommingDocument.map((jsonData) => {
                    newData.data[jsonData.name] = false;
                    detailRole.permissions.forEach((permission) => {
                        if (permission.value.includes(jsonData.title))
                            newData.data[jsonData.name] = true;
                    });
                });
                newRole.data.push(newData);
                return newData;
            }));
            return newRole;
        }));
        return convertedRole;
    }
};

module.exports = {
    getList,
    checkClientIam,
    convertData,
    getAttributes,
    convertDataList,
    readJsonFile
}