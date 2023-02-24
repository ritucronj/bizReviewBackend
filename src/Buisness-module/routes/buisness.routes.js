const express = require("express");
const {
  createBusiness,
  loginBusiness,
  verifyEmail,
  setBusinessPassword,
  getBusiness,
  ssoSignBuisness,
} = require("../controller/buisness.controller");
const router = express.Router();

router.post("/business", createBusiness);

router.get("/verify-email", verifyEmail);

router.put("/setpassword/:id", setBusinessPassword);

router.post("/business/login", loginBusiness);

router.get("/business/:id", getBusiness);

router.post('/business/google', ssoSignBuisness);

module.exports = router;
