const jsonDataCodeModule = require('../config/ex_listRole.json');
const jsonDataAttributes = require('../config/ex_detailRole.json');
const { getAttributes } = require('../roleGroup.service');
const { updateNewRoleInDetailRole } = require('./detailRole.config');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Hàm chuyển đổi dữ liệu chi tiết vai trò từ wso2 giống với file config
 * @param {string} id - ID của người dùng.
 * @param {Object} data - Dữ liệu người dùng cần chuyển đổi.
 * @param {string} tokenGroup - Token để truy cập API nhóm.
 * @param {string} tokenRole - Token để truy cập API vai trò.
 * @returns {Promise<Object>} - Dữ liệu vai trò đã được chuyển đổi.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này chuyển đổi dữ liệu chi tiết vai trò của người dùng bằng cách lấy thông tin từ WSO2 và cấu hình lại dữ liệu theo định dạng cần thiết.
 */

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

    // Biến đếm loại vai trò
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

        // kiểm tra detailGroup có tồn tại không
        if (!detailGroup) {
          throw new Error('không tìm được chi tiết group');
        }
        if (!detailGroup.roles) {
          throw new Error(`không tìm được role của groups: ${group.display}`);
        }
        if (!jsonDataAttributes.column) {
          throw new Error('không có config cho loại chức năng này');
        }

        // kiểm tra jsonDataAttributes.row có tồn tại không
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
        // Tăng biến đếm lên 1 mỗi lần lặp
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
