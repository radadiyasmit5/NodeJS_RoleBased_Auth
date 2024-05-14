import { Schema, model } from "mongoose";
import { USER_SCHEMA, USER_ROLES } from "../utils/constants.js";
import bcrypt from "bcrypt";
import { BCRYPT_SALT_ROUNDS } from "../config/index.js";
import { encryptPassword } from "../utils/bcryptUtils.js";
const UserSchema = new Schema(
  {
    [USER_SCHEMA.NAME]: {
      type: String,
      required: [true, "Name is Required"],
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
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await encryptPassword(this.password, next);
  next();
});

UserSchema.methods.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
export const User = model("users", UserSchema);
