const { getAttributes } = require('../roleGroup.service');
const {
  updateDisplayNameRoleGroups,
  createMethodsInDataRoleGroup,
  updateMethodsInDataRoleGroup,
} = require('./listRole.config');
const jsonDataCodeModule = require('../ex_listRole.json');
const jsonDataAttributes = require('../ex_detailRole.json');
const dotenv = require('dotenv');
dotenv.config();

// Hàm chuyển đổi dữ liệu danh sách roleGroups
const convertDataList = async (dataDb, dataApi, accessToken) => {
  try {
    const convertedRole = dataDb; // Sao chép dữ liệu vai trò đã chuyển đổi
    const newRoles = []; // Mảng để lưu trữ các vai trò mới
    const resourcesApi = dataApi.Resources; // Lấy dữ liệu tài nguyên từ API
    const configRow = jsonDataAttributes.configRow; // Lấy cấu hình hàng từ file JSON
    const convertedRoleData = convertedRole?.data; // Lấy dữ liệu của vai trò đã chuyển đổi

    // Kiểm tra dữ liệu đầu vào
    if (!convertedRole?.data) {
      throw new Error('dữ liệu db không tồn tại');
    }
    if (!Array.isArray(resourcesApi)) {
      throw new Error('resources không phải là 1 mảng');
    }

    // Xử lý từng vai trò trong resourcesApi
    await Promise.all(
      resourcesApi.map(async (role) => {
        // Nếu không có id trong role, trả về dữ liệu đã chuyển đổi
        if (!role.id) {
          return convertedRole;
        }

        // Lấy chi tiết dữ liệu của vai trò từ WSO2
        const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, accessToken);

        // Cập nhật tên hiển thị của roleGroups theo cấu hình
        const displayName = updateDisplayNameRoleGroups(configRow, role.displayName);

        // Lấy dữ liệu cấu hình của module từ file JSON
        const codeModle = jsonDataCodeModule[displayName];
        const permissionRole = dataDetailRole.permissions;

        // Kiểm tra dữ liệu chi tiết vai trò và cấu hình module
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

        // Khởi tạo đối tượng mới với thông tin vai trò
        const newData = [
          {
            _id: role.id,
            codeModleFunction: dataDetailRole.displayName,
            clientId: displayName,
            methods: [],
          },
        ];

        // Tạo các phương thức mới trong dữ liệu vai trò
        createMethodsInDataRoleGroup(codeModle, permissionRole, newData);
        newRoles.push(newData); // Thêm vai trò mới vào mảng newRoles
        return newRoles;
      }),
    );

    // Nếu không có vai trò mới, trả về dữ liệu đã chuyển đổi ban đầu
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
