const express = require("express");
const {
  LogContextImpl,
} = require("twilio/lib/rest/serverless/v1/service/environment/log");
const router = express.Router();

require("dotenv").config();
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  {
    lazyLoading: true,
  }
);

router.post("/sendotp", async (req, res) => {
  const { email } = req.body;
  try {
    const otpResponse = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: `${email}`,
        channel: "email",
      });
    return res.send({ message: `OTP sent successfully` });
  } catch (error) {
    return res.status(500).send({ message: `Internal Server Error` });
  }
});

router.post("/verifyotp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const verifiedResponse = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: `${email}`,
        code: otp,
      });
    if (verifiedResponse.status === "approved") {
      return res.send({ message: `OTP verified successfully` });
    }
    return res.status(400).send({ message: `Invalid OTP` });
  } catch (error) {
    return res.status(500).send({ message: `Internal Server Error` });
  }
});

module.exports = router;
