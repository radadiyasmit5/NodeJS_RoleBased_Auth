import {
  APP_JWT_ACCESSTOKEN_EXPIRY_MILLIS,
  APP_JWT_ENCRYPTION_SECRET,
  APP_JWT_REFRESHTOKEN_EXPIRY_MILLIS,
  APP_VERIFICATIONTOKEN_EXPIRY,
} from "../config/index.js";
import { User } from "../models/User.model.js";
import { VerificationToken } from "../models/VerificationToken.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TOKENNAMES, USER_SCHEMA, VERIFICATION_TOKEN_SCHEMA } from "../utils/constants.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";
import { generateVerificationEmailBody } from "../utils/emailBody.js";

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
      throw new ApiError(500, "Something went wrong while saving user with after adding refreshToken");
    }

    if (!accessToken || !refreshToken) {
      throw new ApiError("Error while creating access or refresh Token.expected token value but got null or undefined");
    }
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching User details inOrder to generate tokens"
    );
  }
};

// method to generate verification token
export const generateVerificationToken = async (user) => {
  try {
    const verificationToken = new VerificationToken({
      [VERIFICATION_TOKEN_SCHEMA.USERID]: user[USER_SCHEMA.ID],
      [VERIFICATION_TOKEN_SCHEMA.EXPIRYDATE]: new Date(Date.now() + APP_VERIFICATIONTOKEN_EXPIRY), // Valid for 24 hours
    });

    verificationToken[VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN] = verificationToken.generateVerificationToken();

    try {
      await verificationToken.save();
    } catch (error) {
      throw new ApiError(500, "Something went wrong while saving verification token");
    }

    if (!verificationToken) {
      throw new ApiError("Error while creating verification Token. expected token value but got null or undefined");
    }
    return { verificationToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching User details inOrder to generate verification token"
    );
  }
};

export const RegisterController = async (req, res, next) => {
  // get the userdetails with password and hash the password
  const { name, username, password, email } = req.body;
  if (!username) {
    return next(new ApiError(400, "username is required"));
  }
  if (!name) {
    return next(new ApiError(400, "name is required"));
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
    new ApiError(500, error.message || "Something went Wrong While saving User");
  }

  //fetching a saved user from DB and creating a response object.
  const createduser = await User.findOne({ _id: savedUser._id }).select(
    `-${USER_SCHEMA.PASSWORD} -${USER_SCHEMA.REFRESHTOKEN}`
  );

  if (!createduser) {
    new ApiError(500, "Not Able to retrive user after registering.");
  }

  // creating verification token to send it to UI.
  const { verificationToken } = await generateVerificationToken(createduser);

  const verificationEmailBody = generateVerificationEmailBody(
    verificationToken[VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN]
  );

  await sendEmail(createduser[USER_SCHEMA.EMAIL], "Please verify your Email!", verificationEmailBody);

  res.status(200).json(new ApiResponse(200, { createduser }, "User saved successfully, Pending Verification!"));
};

export const VerifyController = async (req, res, next) => {
  const token = req.params.verificationToken;

  const verificationToken = await VerificationToken.findOne({ [VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN]: token });

  // Check if token is valid and within expiry.
  if (!verificationToken || verificationToken.expiryDate < new Date()) {
    return res.status(404).json({ message: "Invalid or expired token" });
  }

  // Get user corrosponding to verification token
  const existingUser = await User.findById(verificationToken[VERIFICATION_TOKEN_SCHEMA.USERID]).select(
    `-${USER_SCHEMA.PASSWORD}`
  );

  try {
    existingUser[USER_SCHEMA.ISVERIFIED] = true;
    await existingUser.save({ validateBeforeSave: false });
    await VerificationToken.deleteOne(verificationToken);
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Something went wrong while saving verified user or deleting token entry."));
  }

  res.status(200).json(new ApiResponse(200, null, "Verification Successful"));
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
      throw new ApiError(500, "Something Went Wrong while Looking for user in DB");
    }
  } catch (error) {
    throw new ApiError(500, error.message || "Something Went Wrong while Looking for user in DB");
  }

  // by this time we should have a user object from DB, next step is to check for password
  const isPasswordValid = await user.validatePassword(password);

  if (!isPasswordValid) {
    return next(new ApiError(400, "Please enter a valid password"));
  }

  //by this time we should have a user validated with password,next step is to generate access and refresh tokens
  // creating access and refresh tokens to send it to UI.
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);
  let userwithTokenAdded;
  try {
    userwithTokenAdded = await User.findById(user._id).select(`-${USER_SCHEMA.PASSWORD} -${USER_SCHEMA.REFRESHTOKEN}`);
    if (!userwithTokenAdded) {
      throw new ApiError(500, error.message || "Something Went Wrong while Looking for user in DB");
    }
  } catch (error) {
    throw new ApiError(500, error.message || "Something went wrong while fetching updated user from DB");
  }
  const cookieOptions = {
    httpOnly: "true",
    secure: "true",
  };

  // here we are adding maxAge option to the cookies so that browser will automatically remove the cookie once its expired.
  res
    .status(200)
    .cookie(TOKENNAMES.ACCESSTOKEN, accessToken, {
      ...cookieOptions,
      maxAge: eval(APP_JWT_ACCESSTOKEN_EXPIRY_MILLIS),
    })
    .cookie(TOKENNAMES.REFRESHTOKEN, refreshToken, {
      ...cookieOptions,
      maxAge: eval(APP_JWT_REFRESHTOKEN_EXPIRY_MILLIS),
    })
    .json(
      new ApiResponse(
        200,
        { userwithTokenAdded, accessToken, refreshToken },
        "User Saved Successfully, Registration Successfull"
      )
    );
};

export const LogoutController = async (req, res) => {
  // get the user from req object
  // by this time user is logged in
  // remove refresh token from DB
  // remove tokens from browser
  // send success refresh
  const userFromReq = req.user;
  if (!userFromReq) {
    next(new ApiError(400, "User not found in Request object"));
  }
  const userId = userFromReq?._id;
  // get the user from DB
  const userFromDb = User.findById(userId);
  if (!userFromDb) {
    next(new ApiError(400, "User does not exists in DB"));
  }
  // by this time we have user in DB so remove the refresh token from DB
  const removeRefreshTokenFromuser = await User.findByIdAndUpdate(
    userId,
    {
      $set: { [USER_SCHEMA.REFRESHTOKEN]: null },
    },
    { new: true }
  );

  //by this time refresh token is removed from DB and we have updated user
  // if returned document from update query has refresh token , that means token is still not removed from DB
  if (removeRefreshTokenFromuser?.[USER_SCHEMA.REFRESHTOKEN]) {
    // if token still exists then throw an error
    throw new ApiError(500, "refresh token is not removed from DB");
  }
  // to remove cookie we are setting maxAge to 0 and cookie to empty string.
  const cookieOptions = {
    httpOnly: "true",
    secure: "true",
    maxAge: 0,
  };
  // remove token from client's cookies
  res
    .status(200)
    .cookie(TOKENNAMES.ACCESSTOKEN, "", cookieOptions)
    .cookie(TOKENNAMES.REFRESHTOKEN, "", cookieOptions)
    .json(new ApiResponse(200, "User Loggedout Successfully"));
};

export const refreshAccessToken = async (req, res) => {
  // get the refreshtoken
  // decode the token
  // get the id from token
  // check for the expiry
  // by this time token should be validated and user is vaid user
  // generat a new access token
  // send token and add it to the cookie

  //exctract jwt access token
  const refreshTokenFromReq =
    req.cookies?.[TOKENNAMES.REFRESHTOKEN] || req.headers?.authorization?.replace("Bearer ", "");

  if (!refreshTokenFromReq) {
    next(new ApiError(401, "Token not found, Unauthorized User."));
  }

  const decodeToken = await jwt.decode(refreshTokenFromReq, APP_JWT_ENCRYPTION_SECRET);
  // check for expiry for token

  const tokenExpiryMillis = decodeToken?.exp * 1000;

  if (tokenExpiryMillis < Date.now()) {
    new ApiError(400, "Token is expired Please Login");
  }

  // check for ID in token
  if (!decodeToken && !decodeToken?._id) {
    next(500, "Try to exctract data from token , not Found Data from token");
  }

  const userId = decodeToken?._id;
  let user;
  try {
    user = await User.findById(userId);
    console.log(!user);
    if (!user) {
      throw new ApiError(
        500,
        "got empty user object from DB, expecting user details object. Failed while generating Tokens"
      );
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || " Something went Worng while fetching user from db",
      error?.errors,
      error?.stack
    );
  }

  const accessToken = await user.generateAccessToken();

  if (!accessToken) {
    throw new ApiError(500, "Something went wrong while generating AccessToken");
  }

  const cookieOptions = {
    httpOnly: "true",
    secure: "true",
  };

  // here we are adding maxAge option to the cookies so that browser will automatically remove the cookie once its expired.
  res
    .status(200)
    .cookie(TOKENNAMES.ACCESSTOKEN, accessToken, {
      ...cookieOptions,
      maxAge: eval(APP_JWT_ACCESSTOKEN_EXPIRY_MILLIS),
    })
    .json(new ApiResponse(200, { accessToken }, "Successfully Generated AccessToken"));
};
