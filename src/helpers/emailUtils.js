import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs"; // Import the file system module
import { dirname, join } from "path";
import { fileURLToPath } from "url";

//
import generateOTP from "./generateOTP.js";
import OTP from "../models/otp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatePath = join(
  __dirname,
  "..",
  "templates",
  "emails",
  "OTPTemplate.html"
);

// Read the HTML template file
const emailTemplateSource = fs.readFileSync(templatePath, "utf8");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: process.env.BREVO_EMAIL,
        pass: process.env.BREVO_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "Admin@Pausepoint.com",
      to: to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Function to send OTP by email
const sendOTPByEmail = async (email, userName) => {
  // delete any existing otp with the user email
  await OTP.findOneAndDelete({ email });

  const otp = generateOTP();

  await OTP.create({ email, otp });
  const subject = "OTP Request";
  const intro = "You received this email because you registered on Pause Point";
  const emailText = `Hello ${userName},\n\n${intro}\n\nYour OTP is: ${otp}`;
  // Compile Handlebars template
  const template = handlebars.compile(emailTemplateSource);

  // Render the template with data
  const html = template({ userName, intro, otp });
  return sendEmail({
    to: email,
    subject,
    text: emailText,
    html,
  });
};

export default { sendEmail, sendOTPByEmail };
