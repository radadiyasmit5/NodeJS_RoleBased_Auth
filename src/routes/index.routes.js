// const router = require("express").Router();
import { Router } from "express";
const router = Router();
// const userRoute = require("./users.route.js");
import userRoute from './users.routes.js'

router.use(userRoute);

export default router;
