const jsonDataAttributes = require('../ex_detailRole.json');
const { getAttributes } = require('../roleGroup.service');
const dotenv = require('dotenv');
dotenv.config();

const updateDisplayNameDetailRole = (arr, name) => {
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

const configNewDataInDetailRole = (detailRolePermission, codeModule, newData) => {
  try {
    if (!Array.isArray(detailRolePermission)) {
      throw new Error('detailRolePermission không phải là 1 mảng');
    }
    if (!Array.isArray(codeModule)) {
      throw new Error('codeModule không phải là 1 mảng');
    }
    //config giá trị của newData trong convertData
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

const updateNewRoleInDetailRole = async (detailGroup, codeModule, newRole, tokenRole, convertedRole) => {
  try {
    const configRow = jsonDataAttributes.configRow;
    await Promise.all(
      detailGroup.map(async (role) => {
        //lấy chi tiết dữ liệu của role trong wso2
        const detailRole = await getAttributes(role.value, process.env.HOST_DETAIL_ROLES, tokenRole);
        if (!detailRole) {
          throw new Error('không tìm được chi tiết role');
        }
        //mapping tên trong wso2 ra ngoài
        //config lại tên của permission, xét giá trị cho chúng có tồn tại ko
        const name = await updateDisplayNameDetailRole(configRow, role.display);
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
        // sửa dữ liệu các chức năng của role
        newRole.data.push(newData);
        if (!role.audienceValue) {
          throw new Error('không có id của app');
        }
        //gán id của dữ liệu khởi tạo ban đầu bằng id app đc lấy từ wso2
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
