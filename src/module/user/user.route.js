const router = require('express').Router();
const userController = require('./user.controller');

router
  .route("/Users")
  .post(userController.createUser)

module.exports = router;
