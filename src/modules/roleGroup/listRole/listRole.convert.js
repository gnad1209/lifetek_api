const { getAttributes } = require('../roleGroup.service');
const {
  updateDisplayNameRoleGroups,
  createMethodsInDataRoleGroup,
  updateMethodsInDataRoleGroup,
  configMethodsInDataRoleGroup,
} = require('./listRole.config');
const jsonDataCodeModule = require('../ex_listRole.json');
const jsonDataAttributes = require('../ex_detailRole.json');
const dotenv = require('dotenv');
dotenv.config();

const convertDataList = async (dataDb, dataApi, accessToken) => {
  try {
    const convertedRole = dataDb;
    const newRoles = [];
    const resourcesApi = dataApi.Resources;
    const configRow = jsonDataAttributes.configRow;
    const convertedRoleData = convertedRole?.data;
    if (!convertedRole?.data) {
      throw new Error('dữ liệu db không tồn tại');
    }
    if (!Array.isArray(resourcesApi)) {
      throw new Error('resources không phải là 1 mảng');
    }
    await Promise.all(
      resourcesApi.map(async (role) => {
        //không có role cần tìm trả về data cũ
        if (!role.id) {
          return convertedRole;
        }
        //lấy giá trị detail role
        const dataDetailRole = await getAttributes(role.id, process.env.HOST_DETAIL_ROLES, accessToken);
        //sửa displayName trong roleGroups đúng fomat
        const displayName = updateDisplayNameRoleGroups(configRow, role.displayName);
        //lấy dữ liệu trong file config
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

    // Cập nhật ConvertedRole với các phương thức từ newRoles
    updateMethodsInDataRoleGroup(convertedRoleData, newRoles);
    return convertedRole;
  } catch (e) {
    throw e;
  }
};

module.exports = {
  convertDataList,
};
