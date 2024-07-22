/**
 * Hàm thay đổi tên hiển thị của nhóm vai trò dựa trên tên có sẵn trong mảng cấu hình
 * @param {Array} arr - Mảng cấu hình tên.
 * @param {string} name - Tên ban đầu của nhóm vai trò.
 * @returns {string} - Tên đã được thay đổi theo cấu hình.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này thay đổi tên hiển thị của nhóm vai trò dựa trên tên có sẵn trong mảng cấu hình.
 */
const updateDisplayNameRoleGroups = (arr, name) => {
  try {
    if (!Array.isArray(arr)) {
      throw new Error('arr không phải là 1 mảng');
    }
    if (!name) {
      throw new Error('không tìm thấy name');
    }
    // Duyệt qua từng phần tử trong mảng cấu hình
    arr.forEach((data) => {
      // Nếu name chứa title của phần tử trong cấu hình, thay đổi name thành name của phần tử đó
      if (name.includes(data.title)) {
        name = data.name;
      }
    });
    return name;
  } catch (e) {
    throw e;
  }
};

/**
 *  Hàm thay đổi trường methods trong nhóm vai trò dữ liệu
 * @param {Array} convertedRole - Dữ liệu nhóm vai trò đã được chuyển đổi.
 * @param {Array} newRoles - Dữ liệu nhóm vai trò mới từ API.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này thay đổi trường methods trong nhóm vai trò dữ liệu.
 */
const updateMethodsInDataRoleGroup = (convertedRole, newRoles) => {
  try {
    if (!convertedRole) {
      throw new Error('không tìm thấy convertedRole');
    }
    if (!newRoles) {
      throw new Error('không tìm thấy newRoles');
    }
    convertedRole.forEach((a) => {
      if (!Array.isArray(a.roles)) {
        throw new Error('roles trong convertedRole không phải là 1 mảng');
      }
      a.roles.forEach((role) => {
        newRoles.forEach((newRole) => {
          if (!Array.isArray(newRole)) {
            throw new Error('newRole trong newRoles không phải là 1 mảng');
          }
          // kiểm tra codeModleFnc ở wso2 có tương đồng với trong dữ liệu trong db không, nếu tương đồng thì đổi dữ liệu từ wso2 thành dữ liệu trong file config
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

/**
 * Hàm tạo trường methods trong nhóm vai trò dữ liệu
 * @param {Array} codeModle - Mảng cấu hình phương thức.
 * @param {Array} permissionRole - Mảng quyền hạn của vai trò.
 * @param {Array} newData - Mảng dữ liệu mới sẽ được cập nhật.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này tạo trường methods trong nhóm vai trò dữ liệu.
 */
const createMethodsInDataRoleGroup = (codeModle, permissionRole, newData) => {
  try {
    if (!Array.isArray(codeModle)) {
      throw new Error('codeModle trong convertedDetailRole không phải là 1 mảng');
    }
    if (!Array.isArray(permissionRole)) {
      throw new Error('permissionRole trong convertedDetailRole không phải là 1 mảng');
    }
    if (!Array.isArray(newData)) {
      throw new Error('newData không phải là 1 mảng');
    }
    codeModle.forEach((jsonData) => {
      if (!jsonData.name) {
        return { mgs: 'file config không có name của role' };
      }
      // Tạo đối tượng methods và thêm vào newData
      const methods = {
        name: jsonData.name,
        allow: false,
      };
      newData[0].methods.push(methods);
      // Gọi hàm configMethodsInDataRoleGroup để cấu hình trường methods trong data của listRole
      const respone = configMethodsInDataRoleGroup(permissionRole, jsonData, newData);
      return respone;
    });
  } catch (e) {
    throw e;
  }
};

/**
 * Hàm cấu hình trường methods trong nhóm vai trò dữ liệu
 * @param {Array} permissionRole - Mảng quyền hạn của vai trò.
 * @param {Object} jsonData - Dữ liệu JSON cấu hình.
 * @param {Array} newData - Mảng dữ liệu mới sẽ được cập nhật.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cấu hình trường methods trong nhóm vai trò dữ liệu.
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
      // Thay đổi giá trị của permission nếu khớp với jsonData.title
      if (permission.value.includes(jsonData.title)) {
        permission.value = jsonData.name;
      }
      newData.forEach((n) => {
        n.methods.forEach((method) => {
          // Nếu tên phương thức khớp với giá trị permission, đặt allow thành true
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
