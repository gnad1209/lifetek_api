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
 * Hàm chuyển đổi dữ liệu roleGroups từ wso2 có fomat giống file config
 * @param {Object} dataDb - Dữ liệu role groups từ cơ sở dữ liệu.
 * @param {Object} dataApi - Dữ liệu role groups từ API.
 * @param {string} accessToken - Token truy cập để xác thực lấy danh sách role.
 * @returns {Object} - Dữ liệu role groups đã được chuyển đổi thông qua file config listRole.
 * @throws {Error} - Ném ra lỗi nếu có bất kỳ lỗi nào xảy ra trong quá trình xử lý.
 */
const convertDataList = async (dataDb, dataApi, accessToken) => {
  try {
    const convertedRole = dataDb; // Gán dữ liệu từ cơ sở dữ liệu vào biến convertedRole
    const newRoles = []; // Khởi tạo mảng newRoles để lưu các vai trò mới
    const resourcesApi = dataApi.Resources; // Lấy dữ liệu Resources từ dataApi
    const configRow = jsonDataAttributes.configRow; // Lấy cấu hình hàng từ jsonDataAttributes
    const convertedRoleData = convertedRole?.data; // Lấy dữ liệu data từ convertedRole

    // Kiểm tra xem resourcesApi có tồn tại không
    if (!resourcesApi) {
      throw new Error('trường resourcesApi từ dữ liệu của api không tồn tại');
    }
    // Kiểm tra xem configRow có tồn tại không
    if (!configRow) {
      throw new Error('dữ liệu config không tồn tại');
    }
    // Kiểm tra xem convertedRoleData có tồn tại không
    if (!convertedRoleData) {
      throw new Error('trường data trong db không tồn tại');
    }
    // Kiểm tra xem resourcesApi có phải là mảng không
    if (!Array.isArray(resourcesApi)) {
      throw new Error('resources không phải là 1 mảng');
    }

    await Promise.all(
      resourcesApi.map(async (role) => {
        // Nếu role.id không tồn tại, trả về convertedRole ban đầu trong db
        if (!role.id) {
          return convertedRole;
        }
        // Kiểm tra xem HOST_DETAIL_ROLES có tồn tại không
        if (!process.env.HOST_DETAIL_ROLES) {
          throw new Error('đường dẫn lấy chi tiết role trong wso2 không đúng');
        }
        // Lấy giá trị chi tiết role
        const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, accessToken);

        // Sửa displayName trong roleGroups đúng format
        const displayName = updateDisplayNameRoleGroups(configRow, role.displayName);

        // Lấy dữ liệu trong file config
        const codeModle = jsonDataCodeModule[displayName];
        const permissionRole = dataDetailRole.permissions;

        // Kiểm tra xem dataDetailRole có tồn tại không
        if (!dataDetailRole) {
          throw new Error(`không tìm được bản ghi có id: ${role.id}`);
        }
        // Kiểm tra xem displayName có tồn tại không
        if (!dataDetailRole.displayName) {
          throw new Error('không có displayName');
        }
        // Kiểm tra xem codeModle có tồn tại không
        if (!codeModle) {
          throw new Error(`file config không tìm thấy module: ${displayName}`);
        }
        // Kiểm tra xem permissionRole có phải là mảng không
        if (!Array.isArray(permissionRole)) {
          throw new Error('rolePermission không phải là 1 mảng');
        }

        // Khởi tạo biến newData, cấu hình trường data từ dữ liệu trong db theo file config listRole
        const newData = [
          {
            _id: role.id,
            codeModleFunction: dataDetailRole.displayName,
            clientId: displayName,
            methods: [],
          },
        ];

        // Tạo mới trường method trong biến convertedRole
        createMethodsInDataRoleGroup(codeModle, permissionRole, newData);
        newRoles.push(newData); // Thêm vai trò mới vào mảng newRoles
        return newRoles;
      }),
    );

    // Nếu không có dữ liệu mới, hãy trả lại convertedRole ban đầu
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
