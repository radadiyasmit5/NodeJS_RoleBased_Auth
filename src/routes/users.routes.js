// const router = require("express").Router();
import { Router } from "express";
const router = Router();
// const userRoute = require("./users.route.js");
import passport from "passport";

import { USER_ROUTES } from "../utils/constants.js";
import {
  LoginController,
  RegisterController,
} from "../controllers/userController.controller.js";
import { loginMiddleware } from "../middlewares/auth.middleware.js";

/**
 * @GENERAL_ROUTE - route for user with any role
 */
//route to register user
router.post(USER_ROUTES.REGISTER_USER, RegisterController);

// TODO: implement the custome authenticate function for custome error msg and status code
// app.post("/login", loginMiddleware, (req, res, next) => {
router.post(
  USER_ROUTES.LOGIN_USER,
  loginMiddleware,
  LoginController
);

export default router;
