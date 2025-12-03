// src/utils/emailAlert.js
import "dotenv/config"; // 👈 Add this line at the top!
import nodemailer from "nodemailer";

// Configure the transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL, // Your email (e.g., admin@yourcompany.com)
    pass: process.env.ADMIN_EMAIL_PASS, // Your Google App Password
  },
});



/**
 * Sends an email alert to the admin
 * @param {string} subject - Email subject line
 * @param {string} htmlContent - HTML body of the email
 */
export const sendAdminAlert = async (subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"Nightly Job Bot" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_ALERT_EMAIL, // Send to yourself
      subject: subject,
      html: htmlContent,
    };

    // 👇 Add this debug block
    console.log("DEBUG CREDENTIALS:", {
      UserExists: !!process.env.ADMIN_EMAIL, // Should be true
      PassExists: !!process.env.ADMIN_EMAIL_PASS, // Should be true
      UserValue: process.env.ADMIN_EMAIL, // Check if this prints the email
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email alert sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email alert:", error.message);
    return false;
  }
};
