import { Schema, model } from "mongoose";
import { USER_SCHEMA, USER_ROLES } from "../utils/constants.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  APP_JWT_ACCESSTOKEN_EXPIRY,
  APP_JWT_ENCRYPTION_SECRET,
  APP_JWT_REFRESHTOKEN_EXPIRY,
} from "../config/index.js";
import { encryptPassword } from "../utils/bcryptUtils.js";
import jwt from "jsonwebtoken";
const UserSchema = new Schema(
  {
    [USER_SCHEMA.NAME]: {
      type: String,
      required: [true, "name is Required"],
    },
    [USER_SCHEMA.EMAIL]: {
      type: String,
      required: [true, "Email is Required"],
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    [USER_SCHEMA.ROLE]: {
      type: String,
      default: USER_ROLES.CUSTOMER,
      enum: [USER_ROLES.CUSTOMER, USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE],
      required: true,
    },
    [USER_SCHEMA.USERNAME]: {
      type: String,
      required: [true, "Username is Required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    [USER_SCHEMA.PASSWORD]: {
      type: String,
      required: [true, "Password is Required"],
    },
    [USER_SCHEMA.REFRESHTOKEN]: {
      type: String,
    },
    [USER_SCHEMA.ISVERIFIED]: {
      type: Boolean,
      default: false
    },
    [USER_SCHEMA.VERIFICATIONTOKEN]: {
      type: String
    }
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await encryptPassword(this.password, next);
  next();
});

// method to validate password.
UserSchema.methods.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// method to generete accesstoken
UserSchema.methods.generateAccessToken = async function () {
  const accessToken = await jwt.sign(
    {
      _id: this._id,
      username: this.username,
      name: this.name,
      role: this.role,
    },
    APP_JWT_ENCRYPTION_SECRET,
    {
      expiresIn: APP_JWT_ACCESSTOKEN_EXPIRY,
    }
  );

  return accessToken;
};

// method to generate refereshToken
UserSchema.methods.generateRefreshToken = async function () {
  const refreshToken = await jwt.sign(
    {
      _id: this._id,
    },
    APP_JWT_ENCRYPTION_SECRET,
    {
      expiresIn: APP_JWT_REFRESHTOKEN_EXPIRY,
    }
  );

  return refreshToken;
};

//method to generate email verification token
UserSchema.methods.generateVerificationToken = function () {
  const verificationToken = crypto.randomBytes(16).toString('hex');
  return verificationToken;
}

export const User = model("users", UserSchema);
