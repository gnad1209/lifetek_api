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
const convertData = async (data_db, data_api, access_token) => {
    const convertedRole = data_db;
    const newRoles = []
    // Sử dụng map để lặp qua mảng roles với async/await
    await Promise.all(data_api.Resources.map(async (role) => {
        const dataDetail = await getAttributes(role.id, 'https://192.168.11.35:9443/scim2/v2/Roles', access_token);
        // console.log(role)
        let typeCounter = 0;
        switch (true) {
            case role.displayName.includes("tiep_nhan"):
                role.displayName = 'receive';
                break;
            case role.displayName.includes("xu_ly"):
                role.displayName = 'processing';
                break;
            case role.displayName.includes("phoi_hop"):
                role.displayName = 'support';
                break;
            case role.displayName.includes("nhan_de_biet"):
                role.displayName = 'view';
                break;
            case role.displayName.includes("chi_dao"):
                role.displayName = 'command';
                break;
            case role.displayName.includes("y_kien"):
                role.displayName = 'feedback';
                break;
            case role.displayName.includes("Tra_cuu"):
                role.displayName = 'findStatistics';
                break;
            default:
                // Nếu không khớp với bất kỳ trường hợp nào
                break;
        }
        // Tạo object data mới
        const newData = [{
            _id: role.id,
            titleFunction: '',
            codeModleFunction: dataDetail.displayName,
            clientId: role.displayName,
            methods: [{
                _id: dataDetail.id,
                name: "view",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "set_command",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "free_role_to_set",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "department_incharge",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "set_complete",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "returnDocs",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "add_more_process",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "force_set_complete",
                allow: false
            }, {
                _id: dataDetail.id,
                name: "set_feedback",
                allow: false
            }]
        }];
        typeCounter++;
        // newRole._id = dataDetail.id
        // newRole.codeModleFunction = dataDetail.displayName
        // Thêm newData vào convertedRole
        // newRole.methods = newData;

        // Xử lý permissions
        dataDetail.permissions.forEach((permission) => {
            switch (true) {
                case permission.value.includes("xem"):
                    permission.value = 'view';
                    break;
                case permission.value.includes("giao_chi_dao"):
                    permission.value = 'set_command';
                    break;
                case permission.value.includes("chuyen_xu_li_bat_ky"):
                    permission.value = 'free_role_to_set';
                    break;
                case permission.value.includes("nhan_vb_cua_phong"):
                    permission.value = 'department_incharge';
                    break;
                case permission.value.includes("hoan_thanh_xu_ly"):
                    permission.value = 'set_complete';
                    break;
                case permission.value.includes("tra_lai"):
                    permission.value = 'returnDocs';
                    break;
                case permission.value.includes("them_xu_ly"):
                    permission.value = 'add_more_process';
                    break;
                case permission.value.includes("bat_buoc_hoan_thanh"):
                    permission.value = 'force_set_complete';
                    break;
                case permission.value.includes("xin_y_kien"):
                    permission.value = 'set_feedback';
                    break;
                default:
                    // Nếu không khớp với bất kỳ trường hợp nào
                    break;
            }
            newData.forEach((n) => {
                n.methods.forEach((method) => {
                    if (method.name === permission.value)
                        method.allow = true
                })
            })
        });
        // console.log(newData)
        newRoles.push(newData)
        return newData; // Return newData
    }));
    convertedRole.data.forEach((a) => {
        a.roles.forEach((role) => {
            newRoles.forEach((newRole) => {
                // console.log(newRole)
                newRole.forEach((n) => {
                    //DK1: ROLE DK2: GROUPS
                    if (n.codeModleFunction.includes(role.codeModleFunction) && n.codeModleFunction.includes(a.code) && n.codeModleFunction[0] === a.code[0]) {
                        // console.log('zo day')
                        // console.log(n)
                        role.methods = n.methods
                    }
                })
            })
        })
    })
    // console.log(convertedRole)
    // Return convertedRole sau khi đã được xử lý
    return convertedRole;
};
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


// Mảng để lưu dữ liệu JSON
let jsonDataArray = [];

const convertDataList = async (id, data, token_group, token_role, token_resources) => {
    // const resources = await getList('https://192.168.11.35:9443/api/server/v1/api-resources', token_resources)
    // resources.apiResources.map((apiResource) => {
    //     // if (apiResource.name === 'User')
    //     console.log(apiResource.name)
    // })

    const filePath = 'src/modules/roleGroup/ex_detailRole.json';
    const jsonData = await readJsonFile(filePath);
    if (jsonData) {
        jsonDataArray = jsonData;
    }
    const convertedRole = {
        status: 1,
        id: data.roles[0].audienceValue,
        moduleCode: 'Incomming Document',
        userId: id,
        roles: [],
        __v: 0,
        createdAt: data.meta.created,
        updatedAt: data.meta.lastModified
    };
    let typeCounter = 0;

    await Promise.all(data.groups.map(async (group) => {
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
        newRole.column = jsonDataArray[0];
        newRole.row = jsonDataArray[1];
        convertedRole.roles.push(newRole);
        typeCounter++;

        await Promise.all(detailGroup.roles.map(async (role) => {
            const detailRole = await getAttributes(role.value, 'https://192.168.11.35:9443/scim2/v2/Roles', token_role);

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

            // Thêm newData vào newRole
            newRole.data.push(newData);

            // Xử lý permissions
            detailRole.permissions.forEach((permission) => {
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
            return newData;
        }));
        return newRole;
    }));

    return convertedRole;
};

module.exports = {
    getList,
    checkClientIam,
    convertData,
    getAttributes,
    convertDataList,
    readJsonFile
}