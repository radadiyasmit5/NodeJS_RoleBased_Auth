import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { encryptPassword } from "../utils/bcryptUtils.js";
import { TOKENNAMES, USER_SCHEMA } from "../utils/constants.js";

// method to generate access and refresh token
export const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(
        500,
        "got empty user object from DB, expecting user details object. Failed while generating Tokens"
      );
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    // add refresh token to the user object
    user[USER_SCHEMA.REFRESHTOKEN] = refreshToken;

    try {
      await user.save({ validateBeforeSave: false });
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while saving user with after adding refreshToken"
      );
    }

    if (!accessToken || !refreshToken) {
      throw new ApiError(
        "Error while creating access or refresh Token.expected token value but got null or undefined"
      );
    }
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong while fetching User details inOrder to generate tokens"
    );
  }
};

export const RegisterController = async (req, res, next) => {
  // get the userdetails with password and hash the password
  const { name, username, password, email } = req.body;
  if (!username) {
    return next(new ApiError(400, "username is required"));
  }
  if (!password) {
    return next(new ApiError(400, "password is required"));
  }
  if (!email) {
    return next(new ApiError(400, "email is required"));
  }

  //check if user already exists in DB
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    next(new ApiError(409, "User with email or username already exists", []));
    return;
  }

  // by this time we are sure that user does not exists in DB, so save this user in DB
  let savedUser = null;
  try {
    savedUser = await User.create({
      name,
      password,
      username,
      email,
    });
  } catch (error) {
    new ApiError(500, "Something went Wrong While saving User");
  }

  //fetching a saved user from DB and creating a response object.
  const createduser = await User.findOne({ _id: savedUser._id }).select(
    `-${USER_SCHEMA.PASSWORD} -${USER_SCHEMA.REFRESHTOKEN}`
  );

  if (!createduser) {
    new ApiError(500, "Not Able to retrive user after registering.");
  }

  // creating access and refresh tokens to send it to UI.
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    createduser._id
  );

  //cookie options in order to make it secure and only editable from server
  const cookieOptions = {
    httpOnly: "true",
    secure: "true",
  };

  res
    .status(200)
    .cookie(TOKENNAMES.ACCESSTOKEN, accessToken, cookieOptions)
    .cookie(TOKENNAMES.REFRESHTOKEN, refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { createduser, accessToken, refreshToken },
        "User Saved Successfully, Registration Successfull"
      )
    );
};

export const LoginController = async (req, res, next) => {
  // get data from req obj
  // username or email required check for it
  // find user from db and check the existence
  // check password if valid
  // generate the access and refresh token
  // send cookie
  const { username, email, password } = req.body;

  if (!username && !email) {
    return next(new ApiError(400, "User name or Email required for login"));
  }

  // by this time we have username or email
  let user;
  try {
    user = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!user) {
      throw new ApiError(
        500,
        "Something Went Wrong while Looking for user in DB"
      );
    }
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something Went Wrong while Looking for user in DB"
    );
  }

  // by this time we should have a user object from DB, next step is to check for password
  const isPasswordValid = await user.validatePassword(password);

  if (!isPasswordValid) {
    return next(new ApiError(400, "Please enter a valid password"));
  }

  //by this time we should have a user validated with password,next step is to generate access and refresh tokens
  // creating access and refresh tokens to send it to UI.
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );
  let userwithTokenAdded;
  try {
    userwithTokenAdded = await User.findById(user._id).select(
      `-${USER_SCHEMA.PASSWORD} -${USER_SCHEMA.REFRESHTOKEN}`
    );
    if (!userwithTokenAdded) {
      throw new ApiError(
        500,
        error.message || "Something Went Wrong while Looking for user in DB"
      );
    }
  } catch (error) {
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong while fetching updated user from DB"
    );
  }
  const cookieOptions = {
    httpOnly: "true",
    secure: "true",
  };

  res
    .status(200)
    .cookie(TOKENNAMES.ACCESSTOKEN, accessToken, cookieOptions)
    .cookie(TOKENNAMES.REFRESHTOKEN, refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { userwithTokenAdded, accessToken, refreshToken },
        "User Saved Successfully, Registration Successfull"
      )
    );
};

export const LogoutController = async (req, res) => {};
// todo
// logout controller
// refreshAccesstoken controller

// create a middleware to validate jwt and extract user info from token and add it to req user
