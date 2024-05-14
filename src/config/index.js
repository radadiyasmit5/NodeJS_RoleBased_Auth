// require("dotenv").config({ path: "./.env" });
import "dotenv/config";
export const SECRET = process.env.APP_SECRET;
export const APP_DB = process.env.APP_DB;
export const PORT = process.env.PORT;
export const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS;
export const APP_EXPRESS_SESSION_SECRET =
  process.env.APP_EXPRESS_SESSION_SECRET;
