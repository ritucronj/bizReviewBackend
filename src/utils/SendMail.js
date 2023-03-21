const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  pool: true,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


const sendVerifyEMail = async (name, email, uId) => {
  try {
    const mailOptions = {
      from: {
        name: "BizReview",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `Verify your account`,
      html: `<p> Hi  ${name}
        , <br><br>  Click this link to verify your BizReview account.<br> <br> <a href="${process.env.SERVER_ADDR}/createPassword?id=${uId}"> Verification Link</a> <br> <br> The BizReview Team`,
    };

    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log(`Mail has been sent.`, info.response);
      }
    });
  } catch (error) {}
};

const sendResetPasswordMail = async (name, email, token) => {
  try {

    
    const mailOptions = {
      from: {
        name: "BizReview",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `${name}, here's your password reset link`,
      html: `<p> Hi ${name}
        , <br><br>  We received a request to reset the password on your BizReview account.<br> <br> <a href="${process.env.SERVER_ADDR}/createPassword?token=${token}"> Password reset link</a> <br> <br> Click on this link to complete the reset password. After you click the link above, you&#39;ll be prompted to complete the following steps:<br> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1. Enter new password.<br> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  2. Confirm your new password. <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  3. Hit Submit. <br> <br> <strong> This link is valid for one use only. It will expire in 2 hours. </strong>  <br> <br>  If you didn’t request this password rest or you received this message in error, please disregard this email.<br> <br> The BizReview Team`,
    };

    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log(`Mail has been sent.`, info.response);
      }
    });
  } catch (error) {}
};

const sendResetSuccessMail = async (name, email) => {
  try {
    const mailOptions = {
      from: {
        name: "BizReview",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `${name}, your password was successfully reset`,
      html:
        "<p>Hi " +
        name +
        ", <br /> <br /> <h3> <strong>  You&rsquo;ve successfully updated your password. </strong> </h3> <br />   <br />The BizReview Team</p>",
    };

    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log(`Mail has been sent.`, info.response);
      }
    });
  } catch (error) {}
};

const sendStatusUpdateMail = async (name, email, status) => {
  try {
    const mailOptions = {
      from: {
        name: "BizReview",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `${name}, your request status has updated to ${status}`,
      html:
        "<p>Hi " +
        name +
        `, <br /> <br /> <h3> <strong>  Your status is updated to ${status}. </strong> </h3> <br />   <br />The BizReview Team</p>`,
    };

    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log(`Mail has been sent.`, info.response);
      }
    });
  } catch (error) {}
};

module.exports = {
  sendVerifyEMail,
  sendResetPasswordMail,
  sendResetSuccessMail,
  sendStatusUpdateMail,
};
