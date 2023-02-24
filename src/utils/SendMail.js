const nodemailer = require("nodemailer");
require("dotenv").config();

const sendVerifyEMail = async (name, email, uId) => {
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: {
        name: "BizReview",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `Verify your account`,
      html:
        "<p> Hi " +
        name +
        ', <br><br>  Click this link to verify your BizReview account.<br> <br> <a href="http://localhost:3000/createPassword' +
        uId +
        '"> Verification Link</a> <br> <br> The BizReview Team',
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
};
