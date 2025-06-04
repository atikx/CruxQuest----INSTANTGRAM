import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

export const sendOtpMail = async (to: string, otp: number) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const htmlTemplate = fs
    .readFileSync("./templates/otp-email.html", "utf-8")
    .replace("{{OTP}}", otp);

  const mailOptions = {
    from: `"OTP Service" <${process.env.MAIL_USER}>`,
    to,
    subject: "INSTANTGRAM OTP Code",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP sent to ${to}`);
};
