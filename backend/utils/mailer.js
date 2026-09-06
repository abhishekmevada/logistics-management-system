
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,
    html:`
      <div>
        <h2>Password Reset</h2>
        <p>Your password reset OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
      `
    ,
  });
};

module.exports = { sendOtpEmail };

