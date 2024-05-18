import passport from "passport";
import { ApiError } from "../utils/ApiError.js";
import { TOKENNAMES } from "../utils/constants.js";
import jwt from "jsonwebtoken";
import { APP_JWT_ENCRYPTION_SECRET } from "../config/index.js";
import { User } from "../models/User.model.js";
/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @DESC need this middle ware for login route - read the comment below.
 */

export const validateJwtandExtractuserInfoMiddleware = async (req, res, next) => {
  const accessToken = req.cookies?.[TOKENNAMES.ACCESSTOKEN] || req.headers?.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    next(new ApiError(401, "Token not found, Unauthorized User."));
  }

  const decodeToken = await jwt.decode(accessToken, APP_JWT_ENCRYPTION_SECRET);

  if (!decodeToken) {
    next(new ApiError(401, "Invalid Access Token, Unauthorized User."));
  }

  // by this time user's token is validated and user is valid user and we have extracted user data from token.
  const userId = decodeToken?._id;
  let userDetails;
  try {
    userDetails = await User.findById(userId);
    if (!userDetails) {
      throw new ApiError(400, "Try to fetch user from Db based on Provided Token , User does not exists");
    }
  } catch (error) {
    next(new ApiError(error.statusCode || 500, error.message || "Somethign went wrong while fetching user from DB"));
  }
  // append user field in req object with the data we got from DB
  req.user = userDetails;
  next();
};




//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// this middleware is for login route , while req hits the login route - server will call authenticate method from passport and it will return either user or error. in case of error we want to customize the status code and messege, Thats why we are writing this middleware.
export const loginpassportAuthenticationMiddleware = async (req, res, next) => {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(new ApiError(err.statusCode, err.message, err.errors));
    }
    if (!user) {
      // Handle authentication failure
      next(new ApiError(400, "user not found"));
    }
    // Log in the user
    req.logIn(user, function (err) {
      if (err) {
        return next(new ApiError(err.statusCode, err.message, err.errors));
      }
      // Authentication successful, redirect to dashboard
      next();
    });
  })(req, res, next);
};

// this middleware to identify whether user is authenticated or not
export const userAuthenticationMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    next(new ApiError(401, "User is not Authenticated ,Please Login In to Access The Resources"));
  }
};
// this middleware to identify whether user is authenticated or not and if user is admin user or not
export const adminAuthenticationMiddleware = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    next();
  } else {
    next(new ApiError(401, "User is not Authenticated ,Please Login In to Access The Resources"));
  }
};
