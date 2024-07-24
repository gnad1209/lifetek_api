const jsonDataAttributes = require('../config/detail.config.json');
const { getAttributes } = require('../roleGroup.service');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Hàm cập nhật tên hiển thị theo file config cho detailRole
 * @param {Array} arr - Mảng cấu hình tên hiển thị của role.
 * @param {string} name - Tên ban đầu của role.
 * @returns {string} - Tên đã được thay đổi theo cấu hình.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cập nhật tên hiển thị cho detailRole dựa trên tên có sẵn trong mảng cấu hình.
 */
const updateDisplayNameDetailRole = (arr, name) => {
  try {
    // Kiểm tra xem arr có phải là mảng không
    if (!Array.isArray(arr)) {
      throw new Error('arr không phải là 1 mảng');
    }
    // Kiểm tra xem name có tồn tại không
    if (!name) {
      throw new Error('không tìm thấy name');
    }
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

// Hàm cấu hình trường data mới trong detailRole
/**
 * @param {Array} detailRolePermission - Mảng quyền hạn chi tiết của vai trò.
 * @param {Array} codeModule - Mảng cấu hình dữ liệu theo file config.
 * @param {Object} newData - Dữ liệu mới sẽ được cập nhật.
 * @returns {Object} - Dữ liệu mới đã được cấu hình.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cấu hình dữ liệu mới trong detailRole.
 */
const configNewDataInDetailRole = (detailRolePermission, codeModule, newData) => {
  try {
    //kiểm tra detailRolePermission không phải là 1 mảng hay ko
    if (!Array.isArray(detailRolePermission)) {
      throw new Error('detailRolePermission không phải là 1 mảng');
    }
    //kiểm tra codeModule không phải là 1 mảng hay ko
    if (!Array.isArray(codeModule)) {
      throw new Error('codeModule không phải là 1 mảng');
    }
    //kiểm tra newData có tồn tại hay ko
    if (!newData) {
      throw new Error('không tìm thấy newData');
    }
    codeModule.forEach((jsonData) => {
      // Thiết lập giá trị mặc định cho các chức năng trong newData là false
      newData.data[jsonData.name] = false;
      detailRolePermission.forEach((permission) => {
        if (permission.value.includes(jsonData.title)) {
          // Cập nhật giá trị phương thức trong newData thành true, Nếu giá trị permission chứa title từ phần tử cấu hình
          newData.data[jsonData.name] = true;
        }
      });
    });
    return newData;
  } catch (e) {
    throw e;
  }
};

/**
 * Hàm cập nhật dữ liệu cho trường role mới trong detailRole
 * @param {Array} detailGroup - Mảng nhóm chi tiết, trường roles trong dữ liệu trả về khi call api thông tin group.
 * @param {Array} codeModule - Mảng cấu hình dữ liệu theo file config.
 * @param {Object} newRole - Dữ liệu vai trò mới sẽ được cập nhật.
 * @param {string} tokenRole - Mã token để truy cập API lấy thông tin role.
 * @param {Object} convertedRole - Dữ liệu vai trò đã chuyển đổi.
 * @returns {string} - id app trong wso2 của biến convertedRole.
 * @throws {Error} - Ném ra lỗi nếu có lỗi trong quá trình xử lý.
 * @chức_năng - Hàm này cập nhật trường role mới trong detailRole bằng cách lấy thông tin chi tiết từ WSO2 và cấu hình lại dữ liệu.
 */
const updateNewRoleInDetailRole = async (detailGroup, codeModule, newRole, tokenRole, convertedRole) => {
  try {
    // Lấy cấu hình các vai trò từ jsonDataAttributes
    const configRow = jsonDataAttributes.configOutGoingDocument;
    if (!detailGroup) {
      // Kiểm tra nếu detailGroup không tồn tại
      throw new Error('ko có tên role trong file config');
    }
    if (!codeModule) {
      // Kiểm tra nếu codeModule không tồn tại
      throw new Error('ko có codeModule trong file config');
    }
    if (!newRole) {
      // Kiểm tra nếu newRole không tồn tại
      throw new Error('ko tìm thấy newRole');
    }
    if (!tokenRole) {
      // Kiểm tra nếu tokenRole không tồn tại
      throw new Error('ko tìm thấy token để lấy listRole');
    }
    if (!convertedRole) {
      // Kiểm tra nếu convertedRole không tồn tại
      throw new Error('không có convertedRole');
    }
    await Promise.all(
      detailGroup.map(async (role) => {
        if (!role.value) {
          // Kiểm tra id trong trường role có tồn tại hay không
          throw new Error('không tìm được id của các vai trò từ wso2');
        }
        if (role.display.includes("OutGoingDocument")) {
          const detailRole = await getAttributes(role.value, process.env.HOST_DETAIL_ROLES, tokenRole);
          if (!detailRole) {
            // Kiểm tra có tìm được detailRole hay không
            throw new Error('không tìm được chi tiết role');
          }
          // Cập nhật tên hiển thị cho detailRole
          const name = updateDisplayNameDetailRole(configRow, role.display);
          if (!name) {
            // Kiểm tra name sau khi sửa có tồn tại hay không
            throw new Error('ko có tên role trong file config');
          }
          // Tạo đối tượng newData với các giá trị ban đầu để cấu hình trường Role trong biến newRole
          const newData = {
            _id: role.value,
            name: name,
            data: {},
          };
          // Lấy danh sách mảng permissions từ detailRole
          const detailRolePermission = detailRole.permissions;
          // Cấu hình trường data mới trong detailRole
          configNewDataInDetailRole(detailRolePermission, codeModule, newData);
          newRole.data.push(newData);
          if (!role.audienceValue) {
            throw new Error('không có id của app');
          }
          // Cập nhật id của biến convertedRole
          convertedRole.id = role.audienceValue;
          return role.audienceValue;
        }
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
