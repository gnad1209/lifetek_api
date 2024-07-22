const https = require('https');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const agent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Lấy dữ liệu danh sách các thuộc tính của chức năng cần tìm (vd: groups, users, roles,...)
 * @param {string} host - URL gốc của API endpoint.
 * @param {string} accessToken - Token truy cập để xác thực.
 * @param {string} clientId - ID của client cần lấy các thuộc tính.
 * @returns {Object} - Dữ liệu phản hồi chứa danh sách các thuộc tính.
 * @throws {Error} - Ném ra lỗi nếu gọi API thất bại.
 */
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
    // Lấy data danh sách các nhóm vai trò
    const responseRoleGroup = await axios(configRole);
    return responseRoleGroup.data;
  } catch (error) {
    // Trả về lỗi nếu gọi API thất bại
    console.error('Lỗi khi lấy thuộc tính vai trò:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Lấy dữ liệu chi tiết các thuộc tính của chức năng cần tìm (vd: group, user, role,...)
 * @param {string} userId - ID của người dùng cần lấy các thuộc tính chi tiết.
 * @param {string} host - URL gốc của API endpoint.
 * @param {string} accessToken - Token truy cập để xác thực.
 * @returns {Object} - Dữ liệu phản hồi chứa các thuộc tính chi tiết.
 * @throws {Error} - Ném ra lỗi nếu gọi API thất bại.
 */
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
    console.error('Lỗi khi lấy thuộc tính vai trò:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Kiểm tra cấu hình IAM client trong cơ sở dữ liệu.
 * @param {Object} iamClient - Đối tượng IAM client từ cơ sở dữ liệu.
 * @returns {Object} - Một đối tượng chứa IAM client ID và IAM client secret.
 * @throws {Error} - Ném ra lỗi nếu cấu hình IAM client không hợp lệ.
 */
const getClientIam = (iamClient) => {
  try {
    if (!iamClient) {
      throw new Error('không tìm thấy iamClient');
    }
    const iamClientId = iamClient.iamClientId;
    const iamClientSecret = iamClient.iamClientSecret;
    return { iamClientId: iamClientId, iamClientSecret: iamClientSecret };
  } catch (e) {
    throw e;
  }
};

module.exports = {
  getList,
  getClientIam,
  getAttributes,
};
