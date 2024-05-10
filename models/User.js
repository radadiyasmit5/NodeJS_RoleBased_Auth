const { Schema, model } = require("mongoose");
const { USER_ROLES,USER_SCHEMA } = require('../utils/constants');

const UserSchema = new Schema(
  {
    [USER_SCHEMA.NAME]: {
      type: String,
      required: true
    },
    [USER_SCHEMA.EMAIL]: {
      type: String,
      required: true
    },
    [USER_SCHEMA.ROLE]: {
      type: String,
      default: USER_ROLES.CUSTOMER,
      enum: [USER_ROLES.CUSTOMER, USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE]
    },
    [USER_SCHEMA.USERNAME]: {
      type: String,
      required: true
    },
    [USER_SCHEMA.PASSWORD]: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = model("users", UserSchema);