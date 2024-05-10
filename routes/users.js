const router = require("express").Router()
const {
  userAuthenticationMiddleware,
  adminAuthenticationMiddleware,
} = require("../middlewares/authMiddlewares")
const passport = require("passport")
const {USER_ROUTES} = require("../utils/constants")
const {
  LoginController,
  RegisterController,
} = require("../controllers/userController")

// router.post()
router.post(USER_ROUTES.REGISTER_USER, RegisterController)

// TODO: implement the custome authenticate function for custome error msg and status code
// app.post("/login", loginMiddleware, (req, res, next) => {
router.post(
  USER_ROUTES.LOGIN_USER,
  passport.authenticate("local"),
  LoginController
)

module.exports = router
