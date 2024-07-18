const lodash = require('lodash');
const axios = require('axios');

const Client = require('../../model/client.shareModel');
const getToken = require('../../service/getToken.shareService');

const RoleGroup = require('./roleGroup.model');
const { getList, checkClientIam, convertData, getAttributes, convertDataList } = require('./roleGroup.service');

const dotenv = require('dotenv');
dotenv.config();
const { IAM_ENABLE, HOST_ROLES, HOST_USERS } = process.env;
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
    //Nếu ko có clientID trả về lỗi
    if (!clientId) {
      return res.status(400).json({ msg: "ClientId required" });
    }
    //kiểm tra IAM_ENABLE == "TRUE" call api get list roles
    if (IAM_ENABLE !== "TRUE") {
      const listRoleGroups = await RoleGroup.list({ filter: { clientId: clientId } }, { limit, skip, sort, selector });
      return res.status(400).json(listRoleGroups);
    }
    //kiểm tra clientId có trong tb clientIam không
    const iamClient = await Client.findOne({ clientId: clientId });
    if (!iamClient) {
      return res.status(400).json({ msg: "No IAM config for clientId" });
    }
    const clientIam = await checkClientIam(iamClient);
    //kiểm tra iamClientId và iamClientSecret tồn tại không
    if (!clientIam.iamClientId || !clientIam.iamClientSecret) {
      //lấy được accesstoken từ hàm gettoken
      return res.status(400).json({ msg: "Invalid IAM config for clientId" });
    }
    const accessToken = await getToken(scope, clientIam.iamClientId, clientIam.iamClientSecret);
    if (!accessToken) {
      //data rolegroups từ db và wso2
      return res.status(400).json({ msg: "Access token is not exist" });
    }
    const [listRoleGroups, dataListApi] = await Promise.all([
      RoleGroup.list({ filter: { clientId: clientId } }, { limit, skip, sort, selector }),
      getList(HOST_ROLES, accessToken, clientId)
    ]);
    // return res.status(200).json({ dataChange })
    const convert = await convertDataList(listRoleGroups, dataListApi, accessToken);
    return res.status(200).json(convert);
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
    // Lấy ID người dùng và clientId từ các tham số yêu cầu
    const { userId } = req.params;
    const { clientId } = req.query;
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
    const iamClientDb = await Client.findOne({ clientId: clientId });
    // Nếu không tìm thấy IAM client, trả về phản hồi không tìm thấy
    if (!iamClientDb) {
      return res.status(404).json({ msg: 'Không tìm thấy IamClient' });
    }
    const clientIam = await checkClientIam(iamClientDb);
    // Lấy ID và mật khẩu của IAM client
    if (!clientIam.iamClientId || !clientIam.iamClientSecret) {
      return res.status(404).json({ message: "không tìm thấy iamClientId và không tìm thấy iamClientSecret" });
    }

    // Lấy token cho phạm vi 
    const [tokenGroups, tokenRoles, tokenUsers, tokenResources] = await Promise.all([
      getToken('internal_group_mgt_view', clientIam.iamClientId, clientIam.iamClientSecret),
      getToken('internal_role_mgt_view', clientIam.iamClientId, clientIam.iamClientSecret),
      getToken('internal_user_mgt_view', clientIam.iamClientId, clientIam.iamClientSecret),
      getToken('internal_api_resource_view', clientIam.iamClientId, clientIam.iamClientSecret)
    ]);

    // Nếu không lấy được token, trả về phản hồi lỗi
    switch (true) {
      case !tokenRoles:
        return res.status(400).json({ msg: 'Không thể lấy token role' });
      case !tokenGroups:
        return res.status(400).json({ msg: 'Không thể lấy token group' });
      case !tokenUsers:
        return res.status(400).json({ msg: 'Không thể lấy token user' });
      default:
        break;
    }
    // Lấy các thuộc tính của user
    const roleGroupAttributes = await getAttributes(userId, HOST_USERS, tokenUsers);
    // Nếu không lấy được trả về phản hồi lỗi
    if (!roleGroupAttributes) {
      return res.status(400).json({ msg: 'Không thể lấy vai trò' });
    }
    // Chuyển đổi các thuộc tính sang định dạng mong muốn
    const convert = await convertData(userId, roleGroupAttributes, tokenGroups, tokenRoles, tokenResources);
    // Trả về vai trò đã chuyển đổi
    return res.status(200).json(convert);
  } catch (error) {
    // Ghi log và trả về phản hồi lỗi máy chủ nội bộ trên mọi lỗi
    console.error(error);
    return res.status(500).json({ msg: error });
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
  iamUserBussinessRole
};
