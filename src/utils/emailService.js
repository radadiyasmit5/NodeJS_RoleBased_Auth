import nodemailer from "nodemailer";
import { EMAIL, PASS } from '../config/index.js';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL,
        pass: PASS
    }
})

/**
 * Sends an email with the specified recipient, subject, and body.
 *
 * @param {string} to - The email address of the recipient.
 * @param {string} subject - The subject line of the email.
 * @param {string} body - The HTML content of the email body.
 */
export const sendEmail = (to, subject, body) => {
    transporter.sendMail({from: EMAIL, to, subject, html: body}, (error , info) => {
        if(error) console.log(error);
        else console.log('Email sent: ' + info.response);
    })
}