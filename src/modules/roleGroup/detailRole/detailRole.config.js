const jsonDataAttributes = require('../config/ex_detailRole.json');
const { getAttributes } = require('../config/roleGroup.service');
const dotenv = require('dotenv');
dotenv.config();

// Hàm cập nhật tên hiển thị cho chi tiết vai trò
/**
 * @param {Array} arr - Mảng cấu hình tên.
 * @param {string} name - Tên ban đầu của chi tiết vai trò.
 * @returns {string} - Tên đã được thay đổi theo cấu hình.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cập nhật tên hiển thị cho chi tiết vai trò dựa trên tên có sẵn trong mảng cấu hình.
 */
const updateDisplayNameDetailRole = (arr, name) => {
  try {
    arr.forEach((data) => {
      if (name.includes(data.title)) {
        name = data.name;
      }
    });
    return name;
  } catch (e) {
    throw e;
  }
};

// Hàm cấu hình dữ liệu mới trong chi tiết vai trò
/**
 * @param {Array} detailRolePermission - Mảng quyền hạn chi tiết của vai trò.
 * @param {Array} codeModule - Mảng cấu hình phương thức.
 * @param {Object} newData - Dữ liệu mới sẽ được cập nhật.
 * @returns {Object} - Dữ liệu mới đã được cấu hình.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cấu hình dữ liệu mới trong chi tiết vai trò.
 */
const configNewDataInDetailRole = (detailRolePermission, codeModule, newData) => {
  try {
    if (!Array.isArray(detailRolePermission)) {
      throw new Error('detailRolePermission không phải là 1 mảng');
    }
    if (!Array.isArray(codeModule)) {
      throw new Error('codeModule không phải là 1 mảng');
    }
    codeModule.forEach((jsonData) => {
      newData.data[jsonData.name] = false;
      detailRolePermission.forEach((permission) => {
        if (permission.value.includes(jsonData.title)) {
          newData.data[jsonData.name] = true;
        }
      });
    });
    return newData;
  } catch (e) {
    throw e;
  }
};

// Hàm cập nhật vai trò mới trong chi tiết vai trò
/**
 * @param {Array} detailGroup - Mảng nhóm chi tiết.
 * @param {Array} codeModule - Mảng cấu hình phương thức.
 * @param {Object} newRole - Dữ liệu vai trò mới sẽ được cập nhật.
 * @param {string} tokenRole - Mã token để truy cập API.
 * @param {Object} convertedRole - Dữ liệu vai trò đã chuyển đổi.
 * @returns {Promise<void>}
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cập nhật vai trò mới trong chi tiết vai trò bằng cách lấy thông tin chi tiết từ WSO2 và cấu hình lại dữ liệu.
 */
const updateNewRoleInDetailRole = async (detailGroup, codeModule, newRole, tokenRole, convertedRole) => {
  try {
    const configRow = jsonDataAttributes.configRow;
    await Promise.all(
      detailGroup.map(async (role) => {
        const detailRole = await getAttributes(role.value, process.env.HOST_DETAIL_ROLES, tokenRole);
        if (!detailRole) {
          throw new Error('không tìm được chi tiết role');
        }
        const name = updateDisplayNameDetailRole(configRow, role.display);
        if (!name) {
          throw new Error('ko có tên role trong file config');
        }
        const newData = {
          _id: role.value,
          name: name,
          data: {},
        };
        const detailRolePermission = detailRole.permissions;
        await configNewDataInDetailRole(detailRolePermission, codeModule, newData);
        newRole.data.push(newData);
        if (!role.audienceValue) {
          throw new Error('không có id của app');
        }
        convertedRole.id = role.audienceValue;
        return role.audienceValue;
      }),
    );
  } catch (e) {
    throw e;
  }
};

module.exports = {
  configNewDataInDetailRole,
  updateNewRoleInDetailRole,
  updateDisplayNameDetailRole,
};
