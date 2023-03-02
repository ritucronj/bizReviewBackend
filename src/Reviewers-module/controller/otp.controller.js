const express = require("express");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
const OTP = require("../models/otp.model");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/sendotp", async (req, res) => {
  try {
    const { email } = req.body;
    const generateOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const msg = {
      to: email,
      from: {
        name: "BizReview",
        email: "devtesting520@gmail.com",
      },
      subject: "Your OTP code for verification",
      text: `Your OTP code is ${generateOtp}`,
    };
    await sgMail.send(msg);
    const otp = new OTP({ email: email, code: generateOtp });
    await otp.save();
    res.status(200).send("OTP code sent successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

router.post("/verifyotp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const findOtp = await OTP.findOne({ email: email }).sort({
      created_at: -1,
    });
    if (!findOtp) {
      res.status(400).send("OTP code not found");
    } else if (findOtp.code === otp) {
      res.status(200).send("OTP verified successfully");
    } else {
      res.status(400).send("OTP verification failed");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
