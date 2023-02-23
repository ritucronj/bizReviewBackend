const express = require("express");
const authenticate = require("../../utils/auth.middleware");
const {
  createBusiness,
  loginBusiness,
  verifyEmail,
  setBusinessPassword,
  getBusiness,
  updateBusinessProfile,
  deleteBusiness,
} = require("../controller/buisness.controller");
const router = express.Router();

router.post("/business", createBusiness);

router.get("/verify-email", verifyEmail);

router.put("/setpassword/:id", setBusinessPassword);

router.post("/business/login", loginBusiness);

router.get("/business/:id", getBusiness);

router.put("/business/:id", updateBusinessProfile);

router.delete("/business/:id", deleteBusiness);

module.exports = router;
