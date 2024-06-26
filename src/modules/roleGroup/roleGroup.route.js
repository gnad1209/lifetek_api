const router = require('express').Router();

const roleGroupCtrl = require('./roleGroup.controller');

router
  .route('/')
  .get(roleGroupCtrl.list)
  .post(roleGroupCtrl.create)
  .delete(roleGroupCtrl.deletedList);

router
  .route('/:roleGroupId')
  .get(roleGroupCtrl.get)
  .delete(roleGroupCtrl.del)
  .put(roleGroupCtrl.update);

router.route('/getRole/:userId').get(roleGroupCtrl.iamUserBussinessRole);

router.route('/update-group/:roleGroupId').put(roleGroupCtrl.updateRoleGroupUser);
router.route('/update-group-h05/:roleGroupId').put(roleGroupCtrl.updateRoleGroupUserH05);
router.param('roleGroupId', roleGroupCtrl.load);

module.exports = router;
