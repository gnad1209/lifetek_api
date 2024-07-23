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
  // Kiểm tra xem host có tồn tại không
  if (!host) {
    throw new Error('không tìm thấy đường dẫn truyền vào');
  }
  // Kiểm tra xem accessToken có tồn tại không
  if (!accessToken) {
    throw new Error('không tìm thấy accessToken');
  }
  // Kiểm tra xem clientId có tồn tại không
  if (!clientId) {
    throw new Error('không tìm thấy clientId');
  }
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
    // Lấy data danh sách các loại hình: groups, roles, user,...
    const responseRoleGroup = await axios(configRole);
    // Kiểm tra xem dữ liệu từ wso2 có tồn tại không
    if (!responseRoleGroup) {
      throw new Error('không tìm thấy dữ liệu từ wso2');
    }
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
  // Kiểm tra xem host có tồn tại không
  if (!host) {
    throw new Error('không tìm thấy đường dẫn truyền vào');
  }

  // Kiểm tra xem userId có tồn tại không
  if (!userId) {
    throw new Error('không tìm thấy userId');
  }

  // Kiểm tra xem accessToken có tồn tại không
  if (!accessToken) {
    throw new Error('không tìm thấy accessToken');
  }
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
    // Lấy dữ liệu chi tiết của các loại hình: groups, roles, user,...
    const response = await axios(config);
    // Kiểm tra xem dữ liệu từ wso2 có tồn tại không
    if (!response) {
      throw new Error('không tìm thấy dữ liệu từ wso2');
    }
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
    // Gán giá trị iamClientId và iamClientSecret lấy được vào các biến tương ứng
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
