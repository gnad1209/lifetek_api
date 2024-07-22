const { getAttributes } = require('../roleGroup.service');
const {
  updateDisplayNameRoleGroups,
  createMethodsInDataRoleGroup,
  updateMethodsInDataRoleGroup,
} = require('./listRole.config');
const jsonDataCodeModule = require('../config/ex_listRole.json');
const jsonDataAttributes = require('../config/ex_detailRole.json');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Hàm chuyển đổi dữ liệu danh sách roleGroups
 * @param {Object} dataDb - Dữ liệu role groups từ cơ sở dữ liệu.
 * @param {Object} dataApi - Dữ liệu role groups từ API.
 * @param {string} accessToken - Token truy cập để xác thực lấy danh sách role.
 * @returns {Object} - Dữ liệu role groups đã được chuyển đổi thông qua file config listRole.
 * @throws {Error} - Ném ra lỗi nếu có bất kỳ lỗi nào xảy ra trong quá trình xử lý.
 */
const convertDataList = async (dataDb, dataApi, accessToken) => {
  try {
    const convertedRole = dataDb;
    const newRoles = [];
    const resourcesApi = dataApi.Resources;
    const configRow = jsonDataAttributes.configRow;
    const convertedRoleData = convertedRole?.data;

    if (!resourcesApi) {
      throw new Error('trường resourcesApi từ dữ liệu của api không tồn tại');
    }
    if (!configRow) {
      throw new Error('dữ liệu config không tồn tại');
    }
    if (!convertedRoleData) {
      throw new Error('trường data trong db không tồn tại');
    }
    if (!Array.isArray(resourcesApi)) {
      throw new Error('resources không phải là 1 mảng');
    }

    await Promise.all(
      resourcesApi.map(async (role) => {
        // Không có role cần tìm trả về data cũ
        if (!role.id) {
          return convertedRole;
        }

        // Lấy giá trị chi tiết role
        const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, accessToken);

        // Sửa displayName trong roleGroups đúng format
        const displayName = updateDisplayNameRoleGroups(configRow, role.displayName);

        // Lấy dữ liệu trong file config
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

        // Biến cấu hình trường data từ dữ liệu trong db theo file config listRole
        const newData = [
          {
            _id: role.id,
            codeModleFunction: dataDetailRole.displayName,
            clientId: displayName,
            methods: [],
          },
        ];

        // Thay đổi tên hiển thị dựa trên thuộc tính dữ liệu json
        createMethodsInDataRoleGroup(codeModle, permissionRole, newData);
        newRoles.push(newData);
        return newRoles;
      }),
    );

    // Nếu không có dữ liệu mới, hãy trả lại vai trò đã chuyển đổi ban đầu
    if (newRoles.length === 0) {
      return convertedRole;
    }

    // Cập nhật convertedRole với các phương thức từ newRoles
    updateMethodsInDataRoleGroup(convertedRoleData, newRoles);
    return convertedRole;
  } catch (e) {
    throw e;
  }
};

module.exports = {
  convertDataList,
};
