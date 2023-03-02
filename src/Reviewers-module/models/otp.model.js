const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 300, // OTP code expires after 5 minutes (300 seconds)
  },
});

module.exports = mongoose.model("OTP", otpSchema);
