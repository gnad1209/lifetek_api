const https = require('https');
const axios = require('axios');
const jsonDataPermission = require('./config/permission.config.json');
const jsonDataCodeModule = require('./config/chucnang.config.json');
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

/**
 * Gnad
 * Hàm chuyển đổi dữ liệu roleGroups từ WSO2 có format giống file config
 * @param {Object} dataDb - Dữ liệu role groups từ cơ sở dữ liệu.
 * @param {Object} dataApi - Dữ liệu role groups từ API.
 * @param {string} accessToken - Token truy cập để xác thực lấy danh sách role.
 * @param {string} clientId - clientId trong db.
 * @returns {Object} - Dữ liệu role groups đã được chuyển đổi thông qua file config listRole.
 * @throws {Error} - Ném ra lỗi nếu có bất kỳ lỗi nào xảy ra trong quá trình xử lý.
 */
const convertDataList = async (dataDb, dataApi, accessToken, clientId) => {
  try {
    const convertedRole = dataDb; // Gán dữ liệu từ cơ sở dữ liệu vào biến convertedRole
    const resourcesApi = dataApi.Resources; // Lấy dữ liệu Resources từ dataApi
    const convertedRoleData = convertedRole?.data; // Lấy dữ liệu data từ convertedRole
    const arrCodeModule = Object.keys(jsonDataCodeModule); // Lấy tất cả các key từ jsonDataCodeModule làm mảng

    // Kiểm tra xem resourcesApi có tồn tại không
    if (!resourcesApi) {
      throw new Error('trường resourcesApi từ dữ liệu của api không tồn tại');
    }

    // Kiểm tra xem convertedRoleData có tồn tại không
    if (!convertedRoleData) {
      throw new Error('trường data trong db không tồn tại');
    }

    // Kiểm tra xem resourcesApi có phải là mảng không
    if (!Array.isArray(resourcesApi)) {
      throw new Error('resources không phải là 1 mảng');
    }

    // Duyệt qua từng role trong resourcesApi
    await Promise.all(
      resourcesApi.map(async (role) => {
        // Nếu role.id không tồn tại, trả về convertedRole ban đầu trong db
        if (!role.id) {
          return convertedRole;
        }

        // Lấy codeModule từ dữ liệu role trên WSO2
        const codeModule = getCodeModuleAndNameGroupsInDataWso2(role.displayName, arrCodeModule);

        // Kiểm tra nếu không có codeModule từ dữ liệu ở WSO2 thì bỏ qua vòng lặp hiện tại
        if (codeModule === null) {
          return;
        }

        // Kiểm tra xem HOST_DETAIL_ROLES có tồn tại không
        if (!process.env.HOST_DETAIL_ROLES) {
          throw new Error('đường dẫn lấy chi tiết role trong WSO2 không đúng');
        }

        // Lấy dữ liệu chi tiết của module và kiểm tra xem convertedRoleData có tồn tại không
        const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, accessToken);

        // Kiểm tra xem dataDetailRole có tồn tại không
        if (!dataDetailRole) {
          throw new Error(`không tìm được bản ghi có id: ${role.id}`);
        }

        // Lấy và kiểm tra dữ liệu trường permission có hay không
        const permissionRole = dataDetailRole.permissions;
        if (!permissionRole) {
          throw new Error(`không tìm thấy trường permission trong chi tiết vai trò của WSO2`);
        }

        // Lấy các tên phương thức từ permissionRole
        const methodNames = getNameMethodsInWso2(permissionRole);

        // Duyệt qua từng data trong convertedRoleData
        convertedRoleData.map((data) => {
          // Kiểm tra nếu clientId trong db khác clientId đc nhập vào thì bỏ qua vòng lặp hiện tại
          if (data.clientId !== clientId) {
            return;
          }

          // Kiểm tra nếu trường code trong db khác codeModule từ dữ liệu ở WSO2 thì bỏ qua vòng lặp hiện tại
          if (data.code !== codeModule[0]) {
            return;
          }

          // Cập nhật roles trong db bằng dữ liệu từ WSO2
          const roles = updateRolesInDbByDataWso2(data.roles, methodNames, codeModule[1]);
          data.roles = roles;
        });
      }),
    );
    return convertedRole;
  } catch (e) {
    throw e;
  }
};

/**
 * Cập nhật roles trong db bằng dữ liệu từ WSO2
 * @param {Array} roles - Danh sách các roles.
 * @param {Array} methodNames - Danh sách các tên phương thức.
 * @param {string} codeModule - codeModule lấy từ dữ liệu WSO2.
 * @returns {Array} - Danh sách các roles đã được cập nhật.
 * @throws {Error} - Ném ra lỗi nếu có bất kỳ lỗi nào xảy ra trong quá trình xử lý.
 */
const updateRolesInDbByDataWso2 = (roles, methodNames, codeModule) => {
  try {
    // Kiểm tra roles có hay không
    if (!roles) {
      throw new Error('không tìm thấy roles');
    }
    // Kiểm tra xem roles có phải là mảng không
    if (!Array.isArray(roles)) {
      throw new Error('trường methods không phải là 1 mảng');
    }
    // Kiểm tra codeModule có hay không
    if (!codeModule) {
      throw new Error('không tìm thấy codeModule');
    }

    roles.map((role) => {
      // Kiểm tra nếu codeModuleFunction ở db khác codeModule trong file config thì bỏ qua vòng lặp hiện tại
      if (role.codeModleFunction !== codeModule) {
        return;
      }

      // Cập nhật methods trong db bằng methodNames
      role.methods = updateMethodInDbByDataWso2(methodNames);
    });

    return roles;
  } catch (e) {
    throw e;
  }
};

/**
 * Cập nhật methods trong db bằng methodNames từ WSO2
 * @param {Array} methodNames - Danh sách các tên phương thức.
 * @returns {Array} - Danh sách các methods đã được cập nhật.
 * @throws {Error} - Ném ra lỗi nếu có bất kỳ lỗi nào xảy ra trong quá trình xử lý.
 */
const updateMethodInDbByDataWso2 = (methodNames) => {
  try {
    // kiểm tra methodNames có hay không
    if (!methodNames) {
      throw new Error('không tìm thấy roles');
    }
    // Kiểm tra xem trường Permission trong file config có phải là mảng không
    if (!Array.isArray(jsonDataPermission.Permission)) {
      throw new Error('trường Permission trong file permission config không phải là 1 mảng');
    }
    // Tạo mảng methods mới cấu hình lại mảng cũ trong db từ dữ liệu trên wso2
    const methods = [];
    // lặp qua file config lấy tên và quyền của nhóm người dùng đối với module đó
    jsonDataPermission.Permission.map((item) => {
      methods.push({
        name: item.name,
        allow: methodNames.includes(item.name),
      });
    });

    return methods;
  } catch (e) {
    throw e;
  }
};

/**
 * Lấy tên các phương thức (GET,POST,...) mà role sở hữu từ wso2
 * @param {Array} permissionRole - Danh sách các quyền từ WSO2.
 * @returns {Array} - Danh sách các tên phương thức.
 * @throws {Error} - Ném ra lỗi nếu có bất kỳ lỗi nào xảy ra trong quá trình xử lý.
 */
const getNameMethodsInWso2 = (permissionRole) => {
  try {
    // Kiểm tra xem trường Permission trong file config có phải là mảng không
    if (!Array.isArray(permissionRole)) {
      throw new Error('rolePermission không phải là 1 mảng');
    }
    // Tạo mảng chứa tên các method mà role sở hữu
    const methodNames = [];
    // Lặp trường permission ở danh sách role trên wso2 đẩy giá trị display lấy được vào mảng methodNames
    permissionRole.map((displayName) => {
      methodNames.push(displayName.display);
    });

    return methodNames;
  } catch (e) {
    throw e;
  }
};

/**
 * Hàm lấy CodeModule và têm nhóm người dùng từ wso2
 * @param {string} str - display name được lấy từ danh sách role trên wso2.
 * @param {Array} arrCodeModule - Mảng chứa codeModule lấy từ file config.
 * @returns {Array|null} - codeModule của dữ liệu lấy được từ WSO2 hoặc null nếu không hợp lệ.
 * @throws {Error} - Ném ra lỗi nếu có bất kỳ lỗi nào xảy ra trong quá trình xử lý.
 */
const getCodeModuleAndNameGroupsInDataWso2 = (str, arrCodeModule) => {
  try {
    // Kiểm tra xem str được truyền vào có phải là chuỗi không
    if (typeof str !== 'string') {
      throw new Error('Input phải là một chuỗi');
    }
    // Kiểm tra xem arrCodeModule có phải là mảng không
    if (!Array.isArray(arrCodeModule)) {
      throw new Error('arrCodeModule không phải là 1 mảng');
    }
    // Tách chuỗi thành mảng
    const parts = str.split('_');
    // Kiểm tra mảng vừa tách có 2 phần từ hay không và phần tử thứ 2 có cùng định dạng trong file config không
    if (parts.length === 2 && arrCodeModule.includes(parts[1])) {
      return [parts[0], parts[1]];
    }

    return null;
  } catch (e) {
    throw e;
  }
};

module.exports = {
  getList,
  getClientIam,
  getAttributes,
  convertDataList,
};
