// Hàm thay đổi tên hiển thị của nhóm vai trò dựa trên tên có sẵn trong mảng cấu hình
/**
 * @param {Array} arr - Mảng cấu hình tên.
 * @param {string} name - Tên ban đầu của nhóm vai trò.
 * @returns {string} - Tên đã được thay đổi theo cấu hình.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này thay đổi tên hiển thị của nhóm vai trò dựa trên tên có sẵn trong mảng cấu hình.
 */
const updateDisplayNameRoleGroups = (arr, name) => {
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

// Hàm thay đổi các phương thức trong nhóm vai trò dữ liệu
/**
 * @param {Array} convertedRole - Dữ liệu nhóm vai trò đã được chuyển đổi.
 * @param {Array} newRoles - Dữ liệu nhóm vai trò mới từ API.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này thay đổi các phương thức trong nhóm vai trò dữ liệu.
 */
const updateMethodsInDataRoleGroup = (convertedRole, newRoles) => {
  try {
    convertedRole.forEach((a) => {
      if (!Array.isArray(a.roles)) {
        throw new Error('roles trong convertedRole không phải là 1 mảng');
      }
      a.roles.forEach((role) => {
        newRoles.forEach((newRole) => {
          if (!Array.isArray(newRole)) {
            throw new Error('newRole trong newRoles không phải là 1 mảng');
          }
          newRole.forEach((n) => {
            if (
              n.codeModleFunction.includes(role.codeModleFunction) &&
              n.codeModleFunction.includes(a.code) &&
              n.codeModleFunction[a.code.length + 1] === role.codeModleFunction[0] &&
              n.codeModleFunction[0] === a.code[0]
            ) {
              role.methods = n.methods;
            }
          });
        });
      });
    });
  } catch (e) {
    throw e;
  }
};

// Hàm tạo các phương thức trong nhóm vai trò dữ liệu
/**
 * @param {Array} codeModle - Mảng cấu hình phương thức.
 * @param {Array} permissionRole - Mảng quyền hạn của vai trò.
 * @param {Array} newData - Mảng dữ liệu mới sẽ được cập nhật.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này tạo các phương thức trong nhóm vai trò dữ liệu.
 */
const createMethodsInDataRoleGroup = (codeModle, permissionRole, newData) => {
  try {
    if (!Array.isArray(codeModle)) {
      throw new Error('codeModle trong convertedDetailRole không phải là 1 mảng');
    }
    codeModle.forEach((jsonData) => {
      if (!jsonData.name) {
        return { mgs: 'file config không có name của role' };
      }
      const methods = {
        name: jsonData.name,
        allow: false,
      };
      newData[0].methods.push(methods);
      const respone = configMethodsInDataRoleGroup(permissionRole, jsonData, newData);
      return respone;
    });
  } catch (e) {
    throw e;
  }
};

// Hàm cấu hình các phương thức trong nhóm vai trò dữ liệu
/**
 * @param {Array} permissionRole - Mảng quyền hạn của vai trò.
 * @param {Object} jsonData - Dữ liệu JSON cấu hình.
 * @param {Array} newData - Mảng dữ liệu mới sẽ được cập nhật.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cấu hình các phương thức trong nhóm vai trò dữ liệu.
 */
const configMethodsInDataRoleGroup = (permissionRole, jsonData, newData) => {
  try {
    if (!Array.isArray(permissionRole)) {
      throw new Error('permissionRole trong convertedRole không phải là 1 mảng');
    }
    if (!jsonData) {
      throw new Error('không có sẵn config cho dữ liệu');
    }
    if (!Array.isArray(newData)) {
      throw new Error('newData không phải là 1 mảng');
    }
    permissionRole.forEach((permission) => {
      if (permission.value.includes(jsonData.title)) {
        permission.value = jsonData.name;
      }
      newData.forEach((n) => {
        n.methods.forEach((method) => {
          if (method.name === permission.value) {
            method.allow = true;
          }
        });
      });
    });
  } catch (err) {
    throw err;
  }
};

module.exports = {
  updateDisplayNameRoleGroups,
  updateMethodsInDataRoleGroup,
  createMethodsInDataRoleGroup,
  configMethodsInDataRoleGroup,
};
