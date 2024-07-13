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

// const getRoleAttributes = async (roleCode, accessToken) => {
//     const roleEndpoint = `https://192.168.11.102:9443/scim2/v2/Roles/${roleCode}`;

//     const config = {
//         method: 'get',
//         url: roleEndpoint,
//         headers: {
//             'Authorization': `Bearer ${accessToken}`,
//             'Content-Type': 'application/json',
//         },
//     };

//     try {
//         const response = await axios(config);
//         return response.data;
//     } catch (error) {
//         console.error('Error fetching role attributes:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// };
const getRoleAttributes = async (roleCode, accessToken) => {
    const roleEndpoint = `https://192.168.11.102:9443/scim2/v2/Roles/`;

    const itemsPerPage = 15;

    const config = {
        method: 'get',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    };

    let allRoles = [];
    let startIndex = 1;
    let totalResults = 0;

    try {                                                   
        // const response = await axios(config);
        // return response.data;

        do {
            const response = await axios({
                ...config,
                url: `${roleEndpoint}?startIndex=${startIndex}&count=${itemsPerPage}`
            });

            const data = response.data;
            allRoles = allRoles.concat(data.Resources);
            totalResults = data.totalResults;
            startIndex += itemsPerPage;

        } while (startIndex <= totalResults);

        return allRoles;

    } catch (error) {
        console.error('Error fetching role attributes:', error.response ? error.response.data : error.message);
        throw error;
    }
};
const getGroupAttributes = async (accessToken) => {
    const roleEndpoint = `https://192.168.11.102:9443/scim2/Groups`;

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
        console.error('Error fetching group attributes:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const checkClientIam = (IamClient) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(IamClient)
            const iamClientId = IamClient.iamClientId;
            const iamClientSecret = IamClient.iamClientSecret;
            resolve({ iamClientId: iamClientId, iamClientSecret: iamClientSecret })
        } catch (e) {
            reject(e)
        }
    })
}

function transformData(data, clientid) {
    const output = {
        res: {
            data: []
        }
    };
    data.res.data.Resources.forEach(resource => {
        output.res.data.push({
            applyEmployeeOrgToModuleOrg: true,
            _id: resource.id,
            clientId: clientid,
            name: resource.displayName,
            code: resource.displayName.replace(/\s+/g, '_').toUpperCase(),
            description: "",
            roles: [
                {
                    _id: resource.id,
                    titleFunction: resource.displayName,
                    codeModleFunction: "YOUR_CODE_MODEL_FUNCTION",
                    clientId: "clientid",
                    methods: [
                        { _id: "method1", name: "GET", allow: false },
                        { _id: "method2", name: "POST", allow: false },
                        { _id: "method3", name: "PUT", allow: false },
                        { _id: "method4", name: "DELETE", allow: false },
                        { _id: "method5", name: "EXPORT", allow: false },
                        { _id: "method6", name: "IMPORT", allow: false },
                        { _id: "method7", name: "VIEWCONFIG", allow: false }
                    ]
                }
            ]
        });
    });

    return output;
}

module.exports = {
    getListRoles,
    getRoleAttributes,
    checkClientIam,
    transformData,
    getGroupAttributes
}