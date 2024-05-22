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
import mongoose from "mongoose";

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

/**
 * Generates a verification token for a given user.
 *
 * @param {Object} user - The user object for which the verification token is being generated.
 * @returns {Promise<Object>} An object containing the created verification token.
 * @throws {ApiError} Throws an ApiError if any error occurs during token creation or saving.
 */
export const generateVerificationToken = async (user) => {
  try {
    const verificationToken = new VerificationToken({
      [VERIFICATION_TOKEN_SCHEMA.USERID]: user[USER_SCHEMA.ID],
    });

    // Generate the token value
    verificationToken[VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN] = verificationToken.generateVerificationToken();

    // Save the verification token to the database
    await verificationToken.save();

    return { verificationToken };
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("Validation error while saving verification token:", error);
      throw new ApiError(400, "Invalid data provided for verification token");
    } else if (error instanceof mongoose.Error) {
      console.error("Mongoose error while saving verification token:", error);
      throw new ApiError(500, "Database error while saving verification token");
    } else {
      console.error("Unexpected error while generating verification token:", error);
      throw new ApiError(500, error.message || "Something went wrong while generating the verification token");
    }
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

  if (existedUser && !existedUser[USER_SCHEMA.ISVERIFIED]) {
    const { verificationToken } = await generateVerificationToken(existedUser);

    const verificationEmailBody = generateVerificationEmailBody(
      verificationToken[VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN]
    );

    await sendEmail(existedUser[USER_SCHEMA.EMAIL], "Please verify your Email!", verificationEmailBody);
    return next(new ApiError(409, "Please verify your email."));
  } else if (existedUser && existedUser[USER_SCHEMA.ISVERIFIED]) {
    return next(new ApiError(409, "User with email or username already exists", []));
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

/**
 * Controller to verify a user based on the verification token.
 *
 * @param {Object} req - The request object, containing the verification token in params.
 * @param {Object} res - The response object, used to send the response back to the client.
 * @param {Function} next - The next middleware function in the stack.
 */
export const VerifyController = async (req, res, next) => {
  const token = req.params.verificationToken;

  try {
    const verificationToken = await VerificationToken.findOne({
      [VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN]: token,
    });

    // Check if token is valid and within expiry.
    if (!verificationToken) {
      return next(new ApiError(404, "Invalid token"));
    }

    if (verificationToken[VERIFICATION_TOKEN_SCHEMA.EXPIRYDATE] < new Date()) {
      return next(new ApiError(404, "Expired token"));
    }

    // Get user corresponding to verification token
    const existingUser = await User.findById(verificationToken[VERIFICATION_TOKEN_SCHEMA.USERID]).select(
      `-${USER_SCHEMA.PASSWORD}`
    );

    if (!existingUser) {
      return next(new ApiError(404, "User not found"));
    }

    // Verify the user and save changes
    existingUser[USER_SCHEMA.ISVERIFIED] = true;

    try {
      await existingUser.save({ validateBeforeSave: false });
      await VerificationToken.deleteOne({ _id: verificationToken._id });
    } catch (error) {
      console.error("Error while saving user or deleting verification token:", error);
      return next(new ApiError(500, "Internal server error while updating user or deleting token"));
    }

    res.status(200).json(new ApiResponse(200, null, "Verification successful"));
  } catch (error) {
    console.error("Unexpected error during verification process:", error);
    next(new ApiError(500, "Unexpected server error during verification process"));
  }
};

/**
 * Controller to resend the verification token to the user's email.
 *
 * @param {Object} req - The request object, containing the email in the body.
 * @param {Object} res - The response object, used to send the response back to the client.
 * @param {Function} next - The next middleware function in the stack.
 */
export const ResendVerificationTokenController = async (req, res, next) => {
  // get email from body
  const { email } = req.body;

  try {
    // find user for that email
    const user = await User.findOne({ [USER_SCHEMA.EMAIL]: email });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // find token for that user
    let verificationToken = await VerificationToken.findOne({
      [VERIFICATION_TOKEN_SCHEMA.USERID]: user[USER_SCHEMA.ID],
    });

    if (verificationToken) {
      // remove if retry attempt is > 5
      if (verificationToken[VERIFICATION_TOKEN_SCHEMA.RETRY_ATTEMPTS] > 5) {
        User.deleteOne(user);
        VerificationToken.deleteOne(verificationToken);
        return res.status(409).json(new ApiResponse(409, null, "Max retry attempts exceeded. Register Again."));
      }

      // generate new token and send in email
      verificationToken[VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN] = verificationToken.generateVerificationToken();
      verificationToken[VERIFICATION_TOKEN_SCHEMA.RETRY_ATTEMPTS] += 1;
      verificationToken[VERIFICATION_TOKEN_SCHEMA.EXPIRYDATE] = new Date(
        Date.now() + parseInt(APP_VERIFICATIONTOKEN_EXPIRY, 10)
      );

      const updatedVerificationToken = await verificationToken.save();

      sendEmail(
        user[USER_SCHEMA.EMAIL],
        "Verify your Email",
        generateVerificationEmailBody(updatedVerificationToken[VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN])
      );
    } else {
      return next(new ApiError(404, "No token found. Register first"));
    }

    return res.status(200).json(new ApiResponse(200, null, "Verification email sent successfully"));
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return next(new ApiError(400, "Invalid data provided"));
    } else if (error instanceof mongoose.Error.DocumentNotFoundError) {
      return next(new ApiError(404, "User or Token not found"));
    } else if (error instanceof mongoose.Error) {
      return next(new ApiError(500, "Database connection error"));
    } else {
      return next(new ApiError(500, "Unexpected server error"));
    }
  }
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

  if (!user[USER_SCHEMA.ISVERIFIED]) {
    return next(new ApiError(409, "Please verify your email."));
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
