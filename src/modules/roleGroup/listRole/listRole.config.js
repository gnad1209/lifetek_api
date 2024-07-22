// Hàm thay đổi tên hiển thị của nhóm vai trò dựa trên tên có sẵn trong mảng cấu hình
const updateDisplayNameRoleGroups = (arr, name) => {
  try {
    //config tên theo file config có sẵn
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
const updateMethodsInDataRoleGroup = (convertedRole, newRoles) => {
  try {
    //lặp mảng data trong dữ liệu trả về
    convertedRole.forEach((a) => {
      if (!Array.isArray(a.roles)) {
        throw new Error('roles trong convertedRole không phải là 1 mảng');
      }
      a.roles.forEach((role) => {
        newRoles.forEach((newRole) => {
          if (!Array.isArray(newRole)) {
            throw new Error('newRole trong newRoles không phải là 1 mảng');
          }
          //lặp mảng newRole để lấy những role có trên wso2 so sánh với db
          newRole.forEach((n) => {
            if (
              //kiểm tra codeModleFnc có tên role(role.codeModleFunction) và tên group(a.code) ko
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

//Hàm tạo các phương thức trong nhóm vai trò dữ liệu
const createMethodsInDataRoleGroup = (codeModle, permissionRole, newData) => {
  try {
    if (!Array.isArray(codeModle)) {
      throw new Error('codeModle trong convertedDetailRole không phải là 1 mảng');
    }
    codeModle.forEach((jsonData) => {
      //lỗi file config ko có tên
      if (!jsonData.name) {
        return { mgs: 'file config không có name của role' };
      }
      const methods = {
        name: jsonData.name,
        allow: false,
      };
      newData[0].methods.push(methods);
      // Cập nhật tên của các quyền và đặt allow thành true nếu khớp
      // const permission = changeDisplayName(dataDetailRole.permissions, permission.value);
      const respone = configMethodsInDataRoleGroup(permissionRole, jsonData, newData);
      return respone;
    });
  } catch (e) {
    throw e;
  }
};

//Hàm cấu hình các phương thức trong nhóm vai trò dữ liệu
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
