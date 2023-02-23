const express = require("express");
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
  const { mobile } = req.body;
  try {
    const otpResponse = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: `+91${mobile}`,
        channel: "sms",
      });
    return res.send({ message: `OTP sent successfully` });
  } catch (error) {
    return res.status(500).send({ message: `Internal Server Error` });
  }
});

router.post("/verifyotp", async (req, res) => {
  const { mobile, otp } = req.body;
  try {
    const verifiedResponse = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: `+91${mobile}`,
        code: otp,
      });
    return res.send({ message: `OTP verified successfully` });
  } catch (error) {
    return res.status(500).send({ message: `Internal Server Error` });
  }
});

module.exports = router;
