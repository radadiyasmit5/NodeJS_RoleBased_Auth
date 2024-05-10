const passport = require("passport")

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @DESC need this middle ware for login route - read the comment below.
 */

// this middleware is for login route , while req hits the login route - server will call authenticate method from passport and it will return either user or error. in case of error we want to customize the status code and messege, Thats why we are writing this middleware.
module.exports.loginMiddleware = async (req, res, next) => {
  await passport.authenticate("local", async (err, user, info) => {
    if (err) {
      res.status(401).json(err.message)
      next(err)
    }
    console.log(user, "user in login middleware")
    await req.login(user, (err) => {
      console.log(err, "error in req.login")
      console.log(user, "user in req.login")

      return
    })
    next()
  })(req, res, next)
}

module.exports.userAuthenticationMiddleware = (req, res, next) => {
  if (req.isAuthenicated()) {
    next()
  }else{
    res.status(401).json('User is not Authenticated ,Please Login In to Access The Resources')
  }
}
module.exports.adminAuthenticationMiddleware = (req, res, next) => {
  if (req.isAuthenicated() && req.user.isAdmin ) {
    next()
  }else{
    res.status(401).json('User is not Authenticated ,Please Login In to Access The Resources')
  }
}
