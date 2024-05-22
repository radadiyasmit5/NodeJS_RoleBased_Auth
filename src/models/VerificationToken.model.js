import { Schema, model } from "mongoose";
import { VERIFICATION_TOKEN_SCHEMA } from "../utils/constants.js";
import crypto from "crypto";
import { APP_VERIFICATIONTOKEN_EXPIRY } from "../config/index.js";

const VerificationTokenSchema = new Schema(
  {
    [VERIFICATION_TOKEN_SCHEMA.USERID]: {
      type: Schema.Types.ObjectId,
      required: [true, "User is Required"],
      ref: "users",
    },
    [VERIFICATION_TOKEN_SCHEMA.VERIFICATIONTOKEN]: {
      type: String,
      required: [true, "Verification token is Required"],
      index: true,
    },
    [VERIFICATION_TOKEN_SCHEMA.EXPIRYDATE]: {
      type: Date,
      required: [true, "Expiry Date is Required"],
      index: { expires: 0 },
      default: Date.now(),
    },
    [VERIFICATION_TOKEN_SCHEMA.RETRY_ATTEMPTS]: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

VerificationTokenSchema.pre("save", function (next) {
  if (!this.isModified(VERIFICATION_TOKEN_SCHEMA.EXPIRYDATE)) {
    this[VERIFICATION_TOKEN_SCHEMA.EXPIRYDATE] = new Date(Date.now() + parseInt(APP_VERIFICATIONTOKEN_EXPIRY));
  }
  next();
});

//method to generate email verification token
VerificationTokenSchema.methods.generateVerificationToken = function () {
  return crypto.randomBytes(16).toString("hex");
};

export const VerificationToken = model("VerificationToken", VerificationTokenSchema);
