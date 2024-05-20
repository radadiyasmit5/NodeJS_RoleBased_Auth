import { APP_URL } from "../config/index.js";

/**
 * Generates the HTML body for the email verification message.
 *
 * @param {string} verificationToken - The unique token used to verify the user's email.
 * @returns {string} - The HTML content of the verification email.
 */
export const generateVerificationEmailBody = (verificationToken) => {
  return `
        <p>Thank you for registering!</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${APP_URL}/verify-user/${verificationToken}">Verify Email</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not register, please ignore this email.</p>
    `;
};
