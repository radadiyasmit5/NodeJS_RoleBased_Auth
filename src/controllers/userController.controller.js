import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { encryptPassword } from "../utils/bcryptUtils.js";

export const LoginController = (req, res) => {
  // by this time user should have session and user object should be attached to the req by serializeUser and deserializeUser
  res.send("success");
};

export const RegisterController = async (req, res, next) => {
  // get the userdetails with password and hash the password
  const { name, username, password, email } = req.body;
  if (!username) {
    return res.status(400).json("missing username");
  }
  if (!password) {
    return res.status(400).json("missing password");
  }
  if (!email) {
    return res.status(400).json("missing email");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    next(new ApiError(409, "User with email or username already exists", []));
    return;
  }

  // const hashedPassword = await encryptPassword(password, next);

  // if (!hashedPassword) {
  //   next(new ApiError(500, "There is some issue while creating new user"));
  //   return;
  // }

  const savedUser = await User.create({
    name,
    password,
    username,
    email,
  });

  //creating a response object 
  const responseObj = savedUser._doc;
  delete responseObj?.password;

  res
    .status(200)
    .json(new ApiResponse(200, responseObj, "user saved successfully"));
};
