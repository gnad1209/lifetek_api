const jsonDataCodeModule = require('../config/ex_listRole.json');
const jsonDataAttributes = require('../config/ex_detailRole.json');
const { getAttributes } = require('../roleGroup.service');
const { updateNewRoleInDetailRole } = require('./detailRole.config');
const dotenv = require('dotenv');
dotenv.config();

// Hàm chuyển đổi dữ liệu chi tiết vai trò
const convertDataDetailRole = async (id, data, tokenGroup, tokenRole) => {
  //đang test
  try {
    if (!data) {
      throw new Error('không tìm thấy data user');
    }
    const convertedRole = {
      status: 1,
      id: '',
      moduleCode: 'IncommingDocument',
      userId: id,
      roles: [],
      __v: 0,
      createdAt: data.meta.created,
      updatedAt: data.meta.lastModified,
    };
    //khai báo các module đã được config và lấy dữ liệu của các module đó
    const key = Object.keys(jsonDataCodeModule);
    const codeModule = jsonDataCodeModule[convertedRole.moduleCode];
    let typeCounter = 0;

    if (!key.includes(convertedRole.moduleCode)) {
      return convertedRole;
    }
    if (!Array.isArray(data.groups)) {
      throw new Error('data.groups không phải là 1 mảng');
    }
    await Promise.all(
      data.groups.map(async (group) => {
        //lấy dữ liệu chi tiết groups trong wso2
        const detailGroup = await getAttributes(group.value, process.env.HOST_GROUPS, tokenGroup);
        if (!detailGroup) {
          throw new Error('không tìm tìm được chi tiết group');
        }
        if (!detailGroup.roles) {
          throw new Error(`không tìm được role của groups: ${group.display}`);
        }
        if (!jsonDataAttributes.column) {
          throw new Error('không có config cho loại chức năng này');
        }
        if (!jsonDataAttributes.row) {
          throw new Error('không có config cho các vai trò này');
        }
        const newRole = {
          column: jsonDataAttributes.column,
          row: jsonDataAttributes.row,
          data: [],
          _id: group.value,
          code: group.display,
          type: typeCounter,
          name: group.display,
        };
        //cấu hình trường role trong biến convertedRole
        convertedRole.roles.push(newRole);
        typeCounter++;
        //thêm và sửa các phần trường trong detailRole
        await updateNewRoleInDetailRole(detailGroup.roles, codeModule, newRole, tokenRole, convertedRole);
      }),
    );
    return convertedRole;
  } catch (e) {
    throw e;
  }
};

module.exports = {
  convertDataDetailRole,
};
