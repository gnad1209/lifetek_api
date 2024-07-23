const jsonDataCodeModule = require('../ex_listRole.json');
const jsonDataAttributes = require('../ex_detailRole.json');
const { getAttributes } = require('../roleGroup.service');
const { updateNewRoleInDetailRole } = require('./detailRole.config');
const dotenv = require('dotenv');
dotenv.config();

// Hàm chuyển đổi dữ liệu chi tiết vai trò
const convertDataDetailRole = async (id, data, tokenGroup, tokenRole) => {
  // Đang test
  try {
    // Kiểm tra xem data có tồn tại không
    if (!data) {
      throw new Error('không tìm thấy data user');
    }

    // Khởi tạo đối tượng convertedRole với các thuộc tính cơ bản
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

    // Khai báo các module đã được cấu hình và lấy dữ liệu của các module đó
    const key = Object.keys(jsonDataCodeModule);
    const codeModule = jsonDataCodeModule[convertedRole.moduleCode];
    let typeCounter = 0;

    // Nếu moduleCode không có trong cấu hình, trả về convertedRole
    if (!key.includes(convertedRole.moduleCode)) {
      return convertedRole;
    }

    // Kiểm tra xem data.groups có phải là mảng không
    if (!Array.isArray(data.groups)) {
      throw new Error('data.groups không phải là 1 mảng');
    }

    // Xử lý từng nhóm trong data.groups
    await Promise.all(
      data.groups.map(async (group) => {
        // Lấy chi tiết dữ liệu của nhóm từ WSO2
        const detailGroup = await getAttributes(group.value, process.env.HOST_GROUPS, tokenGroup);
        if (!detailGroup) {
          throw new Error('không tìm tìm được chi tiết group');
        }

        // Kiểm tra xem detailGroup có thuộc tính roles không
        if (!detailGroup.roles) {
          throw new Error(`không tìm được role của groups: ${group.display}`);
        }

        // Kiểm tra cấu hình của loại chức năng và các vai trò
        if (!jsonDataAttributes.column) {
          throw new Error('không có config cho loại chức năng này');
        }
        if (!jsonDataAttributes.row) {
          throw new Error('không có config cho các vai trò này');
        }

        // Khởi tạo đối tượng newRole với thông tin từ nhóm
        const newRole = {
          column: jsonDataAttributes.column,
          row: jsonDataAttributes.row,
          data: [],
          _id: group.value,
          code: group.display,
          type: typeCounter,
          name: group.display,
        };

        // Thêm newRole vào thuộc tính roles của convertedRole
        convertedRole.roles.push(newRole);
        typeCounter++;

        // Cập nhật các thông tin mới cho vai trò trong convertedRole
        await updateNewRoleInDetailRole(detailGroup.roles, codeModule, newRole, tokenRole, convertedRole);
      }),
    );

    // Trả về đối tượng convertedRole đã được cập nhật
    return convertedRole;
  } catch (e) {
    throw e;
  }
};

module.exports = {
  convertDataDetailRole,
};
