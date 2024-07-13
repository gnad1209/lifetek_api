const lodash = require('lodash');
const axios = require('axios');

const Client = require('../../model/client.shareModel');
const GetToken = require('../../service/getToken.shareService');

const RoleGroup = require('./roleGroup.model');
const { getListRoles, getRoleAttributes, checkClientIam, transformData, getGroupAttributes } = require('./roleGroup.service');

const dotenv = require('dotenv');
dotenv.config()

/**
 * Load roleGroup and append to req
 */
async function load(req, res, next, id) {
  // eslint-disable-next-line no-param-reassign
  // req.roleGroup = await RoleGroup.findById(id);
  req.roleGroup = [];
  if (!req.roleGroup) {
    return res.status(404).json({ msg: 'roleGroup not found' });
    // next(new APIError('Item not found', httpStatus.NOT_FOUND, true));
  }
  next();
}
/**
 * list roleGroup
 */
async function list(req, res, next) {
  try {
    //khai báo respsone data rolegroups
    const { limit = 500, skip = 0, clientId, scope, sort, filter = {}, selector } = req.query;
    // const host = 'https://administrator.lifetek.vn:251/role-groups'
    const host = 'https://192.168.11.35:9443/scim2/Roles'
    //Nếu ko có clientID trả về lỗi
    if (!clientId) {
      return res.status(400).json({ message: "ClientId required" })
    }
    else {
      //kiểm tra IAM_ENABLE == "TRUE" call api get list roles
      if (process.env.IAM_ENABLE == "TRUE") {
        //kiểm tra clientId có trong tb clientIam không
        const IamClient = await Client.findOne({ clientId: clientId })
        if (IamClient) {
          const ClientIam = await checkClientIam(IamClient)
          //kiểm tra iamClientId và iamClientSecret tồn tại không
          if (ClientIam.iamClientId || ClientIam.iamClientSecret) {
            //lấy được accesstoken từ hàm gettoken
            const access_token = await GetToken(scope, ClientIam.iamClientId, ClientIam.iamClientSecret)
            if (access_token) {
              const data = await getListRoles(host, access_token, clientId)
              // const dataChange = await transformData(data, clientId)
              return res.status(200).json({ data: data })
            }
          }
          else {
            //trả về lỗi nếu trong bảng clientIam ko có clientID và clientSecret
            return res.json({ message: "Invalid AIM config for clientId" })
          }
        } else {
          //trả về lỗi nếu tb ko tồn tại clientId
          return res.status(400).json({ message: "No AIM config for clientId" })
        }
      }
      else {
        //nếu proccess.env.enable != "TRUE" tìm các bản ghi trong tb roleGroups có clientId trùng khớp
        console.log('zo day')
        const listRoleGroups = await RoleGroup.list({ filter: { clientId: clientId } }, { limit, skip, sort, selector });
        return res.json(listRoleGroups);
      }
    }

  } catch (e) {
    next(e);
  }
}
/**
 * create roleGroup
 */
async function create(req, res, next) {
  try {
    const {
      clientId,
      name,
      code,
      description,
      roles,
      applyEmployeeOrgToModuleOrg = false,
      departments,
      order,
      other,
    } = req.body;
    const existCode = await RoleGroup.findOne({ clientId, code });
    if (existCode) {
      const err = new APIError('Exist roleGroup with code');
      return next(err);
    }
    const roleGroup = new RoleGroup({
      clientId,
      name,
      code,
      description,
      roles,
      applyEmployeeOrgToModuleOrg,
      departments,
      order,
      other,
    });

    return roleGroup.save().then(savedroleGroup => {
      if (savedroleGroup) res.json(savedroleGroup);
      else res.transforemer.errorBadRequest('Can not create item');
    });
  } catch (e) {
    res.json({
      status: 0,
      message: e.message,
    });
  }
}

function appHost(url) {
  if (url) {
    const host = url.split('/');
    return host[2];
  }
}
/**
 * update roleGroup
 */
// eslint-disable-next-line consistent-return
async function update(req, res, next) {
  try {
    const author = req.headers.authorization;
    let host;
    if (author) {
      axios.defaults.headers.common['Authorization'] = author;
    }

    const {
      clientId,
      name,
      code,
      description,
      roles,
      applyEmployeeOrgToModuleOrg = false,
      departments,
      order,
      other,
    } = req.body;
    const existCode = await RoleGroup.findOne({ code });
    if (existCode && code !== req.roleGroup.code) {
      const err = new APIError('Exist roleGroup with code');
      return next(err);
    }
    const roleGroup = req.roleGroup;
    roleGroup.clientId = clientId;
    roleGroup.name = name;
    roleGroup.code = code;
    roleGroup.description = description;
    roleGroup.roles = roles;
    roleGroup.applyEmployeeOrgToModuleOrg = applyEmployeeOrgToModuleOrg;
    roleGroup.departments = departments;
    roleGroup.order = order;
    if (other) {
      roleGroup.other = other;
    }

    const getRederect = await Client.findOne({ clientId });
    if (getRederect) {
      const uri = getRederect.redirectUris[0];
      host = appHost(uri);
    }
    return roleGroup.save().then(async result => {
      // await Employee.updateMany({ roleGroupSource: code }, { firstLogin: true });
      await axios
        .put(
          `https://${host}/api/employees/first-login`,
          { roleGroupSource: code },
          {
            headers: {
              'Content-type': 'application/json',
            },
          },
        )
        .then(response => {
          console.log(response);
        })
        .catch(error => {
          console.log(error.response);
        });
      res.json(result);
    });
  } catch (e) {
    res.json({
      status: 0,
      message: e.message,
    });
  }
}

async function updateRoleGroupUser(req, res, next) {
  try {
    const {
      clientId,
      name,
      code,
      description,
      roles,
      applyEmployeeOrgToModuleOrg = false,
      departments,
      other,
      order,
    } = req.body;
    const existCode = await RoleGroup.findOne({ code });
    if (existCode && code !== req.roleGroup.code) {
      const err = new APIError('Exist roleGroup with code');
      return next(err);
    }
    const dbRoleApplyEmployeeOrgToModuleOrg = req.roleGroup.applyEmployeeOrgToModuleOrg;
    const dbDepartments = req.roleGroup.departments;
    const roleGroup = req.roleGroup;
    roleGroup.clientId = clientId;
    roleGroup.name = name;
    roleGroup.code = code;
    roleGroup.description = description;
    roleGroup.roles = roles;
    roleGroup.applyEmployeeOrgToModuleOrg = applyEmployeeOrgToModuleOrg;
    roleGroup.departments = departments;
    roleGroup.order = order;
    if (other) {
      roleGroup.other = other;
    }

    const [updatedRole, userRoles] = await Promise.all([
      roleGroup.save(),
      Role.updateMany({ groupId: roleGroup._id }, { roles }),
    ]);
    if (applyEmployeeOrgToModuleOrg && !dbRoleApplyEmployeeOrgToModuleOrg) {
      const employeesInGroup = await Employee.find({ roleGroupSource: roleGroup.code }).lean();
      const listOrganizations = await OrganizationUnit.find({ status: STATUS.ACTIVED }).lean();
      await Promise.all(
        employeesInGroup.map(async employee => {
          const employeeOrganizationUnitId =
            employee.organizationUnit && employee.organizationUnit.organizationUnitId
              ? employee.organizationUnit.organizationUnitId.toString()
              : '';
          if (!employeeOrganizationUnitId) return;
          const newDepartRole = {
            code: 'DERPARTMENT',
            column: [
              {
                name: 'view',
                title: 'Xem',
              },
              {
                name: 'edit',
                title: 'Sửa',
              },
              {
                name: 'delete',
                title: 'Xóa',
              },
            ],
            data: listOrganizations.map(item => ({
              data:
                item.path && item.path.includes(employeeOrganizationUnitId)
                  ? { view: true, edit: true, delete: true }
                  : { view: false, edit: false, delete: false },
              expand: false,
              id: item._id,
              name: item._id,
              open: true,
              slug: item.path,
            })),
            type: 0,
            name: 'Phòng ban',
            row: listOrganizations.map(l => ({
              access: false,
              expand: false,
              id: l._id,
              level: l.level,
              name: l._id,
              open: false,
              parent: l.parent,
              slug: l.path,
              title: l.name,
            })),
          };
          return await Promise.all([
            RoleDeparment.updateMany(
              { userId: employee._id, 'roles.name': 'Phòng ban' },
              {
                $set: {
                  'roles.$.data': newDepartRole.data,
                  'roles.$.row': newDepartRole.row,
                },
              },
            ),
            Employee.updateOne(
              { _id: employee._id },
              { $set: { allowedDepartment: { roles: [newDepartRole], moduleCode: true } } },
            ),
          ]);
        }),
      );
    }
    if (!applyEmployeeOrgToModuleOrg && departments) {
      if (
        dbDepartments &&
        (lodash.isEqual(JSON.parse(JSON.stringify(dbDepartments)), departments) || dbRoleApplyEmployeeOrgToModuleOrg)
      ) {
        return res.json(updatedRole);
      }
      const employeesInGroup = await Employee.find({ roleGroupSource: roleGroup.code }).lean();
      await Promise.all(
        employeesInGroup.map(async employee =>
          Promise.all([
            RoleDeparment.updateMany(
              { userId: employee._id, 'roles.name': 'Phòng ban' },
              {
                $set: {
                  'roles.$.data': departments.roles[0].data,
                  'roles.$.row': departments.roles[0].row,
                },
              },
            ),
            Employee.updateOne(
              { _id: employee._id },
              { $set: { allowedDepartment: { ...departments, moduleCode: true } } },
            ),
          ]),
        ),
      );
    }
    return res.json(updatedRole);
  } catch (e) {
    console.log('update role group error', e);
    return next(e);
  }
}

async function updateRoleGroupUserH05(req, res, next) {
  try {
    let host;
    const {
      clientId,
      name,
      code,
      description,
      roles,
      applyEmployeeOrgToModuleOrg = false,
      departments,
      other,
      order,
    } = req.body;
    // console.log('othes', other);
    const existCode = await RoleGroup.findOne({ code });
    if (existCode && code !== req.roleGroup.code) {
      const err = new APIError('Exist roleGroup with code');
      return next(err);
    }
    const roleGroup = req.roleGroup;
    roleGroup.clientId = clientId;
    roleGroup.name = name;
    roleGroup.code = code;
    roleGroup.description = description;
    roleGroup.roles = roles;
    roleGroup.applyEmployeeOrgToModuleOrg = applyEmployeeOrgToModuleOrg;
    roleGroup.departments = departments;
    roleGroup.order = order;
    if (other) {
      roleGroup.other = other;
    }
    const [updatedRole, userRoles] = await Promise.all([
      roleGroup.save(),
      Role.updateMany({ groupId: roleGroup._id }, { roles }),
    ]);
    const getRederect = await Client.findOne({ clientId });
    if (getRederect) {
      const uri = getRederect.redirectUris[0];
      host = appHost(uri);
    }
    await axios.put(
      `https://${host}/api/employeesV2/first-login`,
      { roleGroupSource: code },
      {
        headers: {
          'Content-type': 'application/json',
        },
      },
    );
    return res.json(updatedRole);
  } catch (e) {
    return next(e);
  }
}
/**
 * Delete costEstimate.
 * @returns roleGroup
 */
function del(req, res, next) {
  const roleGroup = req.roleGroup;
  roleGroup.status = STATUS.DELETED;
  roleGroup.code = '';

  roleGroup
    .save()
    .then(result => {
      res.json({
        success: true,
        data: result,
      });
    })
    .catch(e => next(e));
}

async function deletedList(req, res, next) {
  try {
    const { ids } = req.body;
    const arrDataDelete = ids.map(async roleGroupId => RoleGroup.findById(roleGroupId).remove());
    const deletedData = await Promise.all(arrDataDelete);
    res.json({
      success: true,
      data: deletedData,
    });
  } catch (e) {
    //   console.log(e)
    next(e);
  }
}
function get(req, res) {
  res.json(req.roleGroup);
}

/**
 * Lấy các vai trò kinh doanh của người dùng từ IAM
 * @param {Object} req - Đối tượng yêu cầu
 * @param {Object} res - Đối tượng phản hồi
 * @param {Function} next - Hàm middleware tiếp theo
 * @returns {Object} Các vai trò kinh doanh của người dùng
 */
async function iamUserBussinessRole(req, res, next) {
  try {
    // Lấy ID người dùng từ các tham số yêu cầu
    const { userId } = req.params;

    // Nếu không có ID người dùng, trả về phản hồi lỗi
    if (!userId) {
      return res.status(400).json({ msg: 'Yêu cầu ID người dùng' });
    }

    // Nếu IAM không được kích hoạt, lấy vai trò từ cơ sở dữ liệu cục bộ
    if (!process.env.IAM_ENABLE) {
      const role = await RoleGroup.findOne({ userId });

      // Nếu không tìm thấy vai trò, trả về phản hồi không tìm thấy
      if (!role) {
        return res.status(404).json({ msg: 'Không tìm thấy vai trò' });
      }

      // Trả về vai trò từ cơ sở dữ liệu cục bộ
      return res.json(role);
    }

    // Tìm IAM client
    const IamClient = {
      iamClientId: "rQksvApJaQIymEJPe8RQK1DxMA0a",
      iamClientSecret: "lTiH7SxDqG8Lfto0rK_L74ieQTRQ7r6N2PMCoxdYJVEa",
    }

    // Nếu không tìm thấy IAM client, trả về phản hồi không tìm thấy
    // if (!IamClient) {
    //   return res.status(404).json({ msg: 'Không tìm thấy IamClient' });
    // }

    // Lấy ID và mật khẩu của IAM client
    const iamClientId = IamClient.iamClientId;
    const iamClientSecret = IamClient.iamClientSecret;

    // Tìm IAM client với ID và mật khẩu cung cấp
    const iam = await Client.find({ iamClientId, iamClientSecret });

    // Nếu không tìm thấy IAM client, trả về phản hồi chỉ ra cấu hình IAM bị thiếu
    if (!iam) {
      return res.json('Thiếu cấu hình IAM cho clientId');
    }

    // Lấy token cho phạm vi 'internal_role_mgt_view'
    const token = await GetToken('internal_role_mgt_view', iamClientId, iamClientSecret);

    // Nếu không lấy được token, trả về phản hồi lỗi
    if (!token) {
      return res.status(400).json({ msg: 'Không thể lấy token IAM' });
    }

    // Lấy các thuộc tính vai trò cho người dùng từ IAM
    const roleAttributes = await getRoleAttributes(userId, token);

    // Nếu không lấy được các thuộc tính vai trò, trả về phản hồi lỗi
    if (!roleAttributes) {
      return res.status(400).json({ msg: 'Không thể lấy vai trò' });
    }

    // Chuyển đổi các thuộc tính vai trò sang định dạng mong muốn
    const convertedRole = {
      userId: userId,
      roles: roleAttributes
    };
    // const convertedRole = {
    //   userId: userId,
    //   roles: roleAttributes.permissions.map(role => ({
    //     code: role.display,
    //     name: role.value,
    //   })),
    // };

    // Trả về vai trò đã chuyển đổi
    return res.json(convertedRole);
  } catch (error) {
    // Ghi log và trả về phản hồi lỗi máy chủ nội bộ trên mọi lỗi
    console.error(error);
    return res.status(500).json({ msg: 'Lỗi Máy chủ Nội bộ' });
  }
}
async function listRoleDHVB(req, res, next) {
  try {
    const arrayPermissions = [
      "dhvb_bat_buoc_hoan_thanh",
      "dhvb_nhan_vb_cua_phong",
      "dhvb_hoan_thanh_xu_ly",
      "dhvb_tra_lai",
      "dhvb_giao_chi_dao",
      "dhvb_xem",
      "dhvb_them_xu_ly",
      "dhvb_chuyen_xu_ly_bat_ly",
      "dhvb_xin_y_kien"
    ];

    // // Nếu IAM không được kích hoạt, lấy vai trò từ cơ sở dữ liệu cục bộ
    // if (!process.env.IAM_ENABLE) {
    //   const role = await RoleGroup.findOne({ userId });

    //   // Nếu không tìm thấy vai trò, trả về phản hồi không tìm thấy
    //   if (!role) {
    //     return res.status(404).json({ msg: 'Không tìm thấy vai trò' });
    //   }

    //   // Trả về vai trò từ cơ sở dữ liệu cục bộ
    //   return res.json(role);
    // }

    // Tìm IAM client
    const IamClient = {
      iamClientId: "rQksvApJaQIymEJPe8RQK1DxMA0a",
      iamClientSecret: "lTiH7SxDqG8Lfto0rK_L74ieQTRQ7r6N2PMCoxdYJVEa",
    }

    // Nếu không tìm thấy IAM client, trả về phản hồi không tìm thấy
    // if (!IamClient) {
    //   return res.status(404).json({ msg: 'Không tìm thấy IamClient' });
    // }

    // Lấy ID và mật khẩu của IAM client
    const iamClientId = IamClient.iamClientId;
    const iamClientSecret = IamClient.iamClientSecret;

    // Tìm IAM client với ID và mật khẩu cung cấp
    const iam = await Client.find({ iamClientId, iamClientSecret });

    // Nếu không tìm thấy IAM client, trả về phản hồi chỉ ra cấu hình IAM bị thiếu
    if (!iam) {
      return res.json('Thiếu cấu hình IAM cho clientId');
    }

    // Lấy token cho phạm vi 'internal_role_mgt_view'
    const token_role = await GetToken('internal_role_mgt_view', iamClientId, iamClientSecret);
    const token_group = await GetToken('internal_group_mgt_view', iamClientId, iamClientSecret);

    // Nếu không lấy được token, trả về phản hồi lỗi
    if (!token_role || !token_group) {
      return res.status(400).json({ msg: 'Không thể lấy token IAM' });
    }


    // Lấy các thuộc tính vai trò cho người dùng từ IAM
    const roleAttributes = await getRoleAttributes("", token_role);
    const groupAttributes = await getGroupAttributes(token_group);
    // console.log(roleAttributes);


    // Nếu không lấy được các thuộc tính vai trò, trả về phản hồi lỗi
    if (!roleAttributes || !groupAttributes) {
      return res.status(400).json({ msg: 'Không thể lấy dữ liệu' });
    }

    // convert data ROLE
    var convertedRole = roleAttributes.map(item => {
      return ({
        clientId : item.audience.display,
        displayName: item.displayName,
        permissions: item.permissions.map(item => ({
          name: item.display,
          value: item.value,
        })),
        groups: item.groups ? item.groups.map(group =>
        ({
          display: group.display,
          _id: group.value
        })
        ) : [],
        _id: item.id,

      })
    });

    // convert data GROUP
    var convertedGroup = await groupAttributes.Resources.map(item => ({
      displayName: item.displayName,
      roles: item.roles.map(item => ({
        display: item.display,
        _id: item.value,
      })),
      _id: item.id,
    }));

    // check display Group === với displayName Role
    function finDisplayNameAndConvertAllowTrue(arr, name) {

      // tìm item có display Group === với displayName Role
      const r = arr.find(item => item.displayName === name)

      // gắn cho allow = true với những item đó
      r.permissions.forEach(permission => {
        if (arrayPermissions.includes(permission.value)) {
          r.permissions.forEach(permission => {
            permission.allow = true;
          });
        }
      });

      // thêm toàn bộ hành động với allow = false vào mảng r.permission
      arrayPermissions.forEach(permission => {
        if (!r.permissions.includes(permission)) {
          r.permissions.push({
            name: permission,
            value: permission,
            allow: false
          });
        }
      });

      // xóa toàn item allow false có value bằng với value có allow là true

      // tìm hành động được làm allow =  true
      const truePermissions = r.permissions.filter(permission => permission.allow);

      // tập hợp chứa value của permission
      const trueValues = new Set(truePermissions.map(permission => permission.value));

      // chứa các phần tử có allow là false và value không trùng với bất kỳ giá trị nào trong trueValues
      const falsePermissions = r.permissions.filter(permission => !permission.allow && !trueValues.has(permission.value));

      // kết hợp truePermissions và falsePermissions
      const result = [...truePermissions, ...falsePermissions];

      return result;
    };


    // convertlist role
    const converted = convertedGroup.map(item => ({
      _id: item._id,
      displayName: item.displayName,
      roles: item.roles.map(item => ({
        _id: item._id,
        display: item.display,
        method: finDisplayNameAndConvertAllowTrue(convertedRole, item.display)
      }))
    }));

    return res.json(converted);
  } catch (error) {
    return res.status(500).json(error);
  }
}

module.exports = {
  list,
  load,
  create,
  update,
  del,
  get,
  deletedList,
  updateRoleGroupUser,
  updateRoleGroupUserH05,
  iamUserBussinessRole,
  listRoleDHVB
};
