const express = require("express");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
const OTP = require("../models/otp.model");
const User = require("../models/user.models");
require("dotenv").config();
const { jwtGenerate } = require("../../utils/util.function");

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
    const user= await User.findOne({ email: email })
    if (!findOtp) {
      res.status(400).send("OTP code not found");
    } else if (findOtp.code === otp && user) {
       const token = jwtGenerate(req.body, "secret", {
          expiresIn: "24H",
        });
       await user.updateOne(
        { email: email },
        { $set: { status: 'active', isEmailVerified: true } })
      res.status(200).send({message:"OTP verified successfully",token:token,user:user});
    } else {
      res.status(400).send("OTP verification failed");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
