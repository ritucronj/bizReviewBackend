const express = require("express");
const {
  createBusiness,
  loginBusiness,
  verifyEmail,
} = require("../controller/buisness.controller");
const router = express.Router();

router.post("/business", createBusiness);

router.get("/verify-email", verifyEmail);

router.post("/business/login", loginBusiness);

module.exports = router;
