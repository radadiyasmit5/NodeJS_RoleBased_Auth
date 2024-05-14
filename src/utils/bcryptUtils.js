import bcrypt from "bcrypt";
import { BCRYPT_SALT_ROUNDS } from "../config/index.js";
import { ApiError } from './ApiError.js';

export const encryptPassword = async (plainTextPassword, next) => {
  try {
    const hashedPassword = await bcrypt.hash(
      plainTextPassword,
      Number(BCRYPT_SALT_ROUNDS)
    );
    return hashedPassword;
  } catch (error) {
    next(new ApiError(error.statusCode,error.message,error.errors,error.stack));
  }
};
