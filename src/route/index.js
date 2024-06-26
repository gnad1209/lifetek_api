const roleGroupsRoute = require('../module/roleGroup/roleGroup.route');
const userRoute = require('../module/user/user.route')

const routes = (app) => {
    app.use('/roleGroup/', roleGroupsRoute)
    app.use('/scim2/', userRoute)
}
module.exports = routes