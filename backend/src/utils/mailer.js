import { transporter } from "../index.js";
import  config  from "../config/env.config.js";

async function sendTestMail(data) {
    try {
        const testMailOptions = {
            from: `"Server Notifier" <${config.email.id}>`, // Sender address
            to: "chetanmohite2128@gmail.com", // Recipient address
            subject: "🚀 Service is Running Live!",
            html: `
    <div style="font-family: Arial, sans-serif; padding: 30px 20px; background: #f6f8fa;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.07); padding: 24px;">
        <h2 style="color: #28a745; margin-top: 0;">
          ✅ Service Started Successfully
        </h2>
        <p style="color: #222; font-size: 1.1em;">Your server is live and running. Here are the details:</p>
        <table style="width: 100%; margin: 18px 0 30px; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; font-weight: bold;">Hostname/IP:</td>
            <td style="padding: 10px 0;">${data.host}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold;">Port:</td>
            <td style="padding: 10px 0;">${data.port}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold;">URL:</td>
            <td style="padding: 10px 0;">
              <a href="${data.url}" style="color: #007bff; text-decoration: none;">${data.url}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold;">Date & Time:</td>
            <td style="padding: 10px 0;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
          </tr>
        </table>
        <div style="text-align: center;">
          <span style="background: #28a745; color: #fff; padding: 9px 24px; border-radius: 5px; display: inline-block; letter-spacing: 1px;">
            LIVE
          </span>
        </div>
        <p style="font-size: 0.95em; color: #666; margin-top: 35px;">
          <em>Automated notification. No action required.</em>
        </p>
      </div>
    </div>
  `,
        };
        const info = await transporter.sendMail(testMailOptions);
        console.log("Success! Test email sent:", info.response);
    } catch (error) {
        console.log("Error occurred:", error.message);
    }
}

/**
 * Sends an email using the provided mail options.
 *
 * @async
 * @function sendMail
 * @param {Object} mailOptions - The email options object.
 * @param {string} mailOptions.from - The sender's email address.
 * @param {string} mailOptions.to - The recipient's email address.
 * @param {string} mailOptions.subject - The subject of the email.
 * @param {string} [mailOptions.text] - The plain text body of the email.
 * @param {string} [mailOptions.html] - The HTML body of the email.
 * @returns {Promise<void>} Resolves when the email is sent or logs an error if sending fails.
 */
async function sendMail(mailOptions) {
    console.log("sending mail : ", mailOptions);
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Success! Email sent:", info.response);
    } catch (error) {
        console.log("Error occurred:", error.message);
    }
}

export { sendTestMail, sendMail };
