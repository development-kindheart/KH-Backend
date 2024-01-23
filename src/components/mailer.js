const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
const mailer = async (email, forgotPasswordToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
      auth: {
        user: process.env.MailerEmail,
        pass: process.env.MailerPwd,
      },
    });
    const mailOptions = {
      from: process.env.MailerEmail,
      to: email,
      subject: "Reset Your Password",
      html: `<p>Hello <a href='${process.env.REACT_BASE_URL}/resetPassword?token=${forgotPasswordToken}'>Click Here</a> to reset your password </p>`,
    };
    transporter.sendMail(mailOptions, function (error, success) {
      if (error) {
        console.log("Error in nodemailer ", error);
      } else {
        console.log("Mail Send Successfully ", success.response);
      }
    });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};
module.exports = mailer;
