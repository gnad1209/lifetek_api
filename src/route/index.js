const roleGroupsRoute = require('../roleGroup/roleGroup.route');
const userRoute = require('../user/user.route')

const routes = (app) =>{
    app.use('/roleGroup/',roleGroupsRoute)
    app.use('/scim2/',userRoute)
}
module.exports = routes