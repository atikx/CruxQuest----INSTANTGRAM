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

export const sendMilestoneMail = async (
  email: string,
  name: string,
  postId: string,
  milestone: number
) => {
  const postLink = `${process.env.client_url}/post/${postId}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const htmlTemplate = fs
    .readFileSync("./templates/milestone-email.html", "utf-8")
    .replace(/{{NAME}}/g, name)
    .replace(/{{MILESTONE}}/g, milestone.toString())
    .replace(/{{POST_LINK}}/g, postLink);

  const mailOptions = {
    from: `"InstantGram" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `🎉 Your post hit ${milestone} likes!`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Milestone email sent to ${email} for post ${postId}`);
};
