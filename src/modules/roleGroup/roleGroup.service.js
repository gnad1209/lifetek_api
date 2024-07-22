const https = require('https');
const axios = require('axios');
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
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    httpsAgent: agent,
  };
  try {
    //lấy data list role groups
    const responseRoleGroup = await axios(configRole);
    return responseRoleGroup.data;
  } catch (error) {
    //trả về lỗi nếu ko call được api list role
    console.error('Error fetching role attributes:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const getAttributes = async (userId, host, accessToken) => {
  const roleEndpoint = `${host}/${userId}`;

  const config = {
    method: 'get',
    url: roleEndpoint,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
    return { iamClientId: iamClientId, iamClientSecret: iamClientSecret };
  } catch (e) {
    throw e;
  }
};

module.exports = {
  getList,
  checkClientIam,
  getAttributes,
};
