const express = require("express");
const authenticate = require("../../utils/auth.middleware");
const {
  createBusiness,
  loginBusiness,
  verifyEmail,
  setBusinessPassword,
  getBusiness,
  ssoSignBuisness,
  updateBusinessProfile,
  deleteBusiness,
  searchReviews,
  forgotPass,
  resetPass,
  reviewReply,
  getAllBusiness,
  searchBusiness
} = require("../controller/buisness.controller");
const router = express.Router();

router.post("/business", createBusiness);

router.get("/verify-email", verifyEmail);

router.put("/setpassword/:id", setBusinessPassword);

router.post("/business/login", loginBusiness);

router.get("/business/:id", getBusiness);

router.post("/business/google", ssoSignBuisness);

router.put("/business/:id", updateBusinessProfile);

router.get('/getAllBusiness',getAllBusiness)

router.get('/searchBusiness',searchBusiness)

router.delete("/business/:id", deleteBusiness);

router.get("/review-search", searchReviews);

router.post("/forgot-password", forgotPass);

router.put("/reset-password", resetPass);

router.post("/reviews/:id/reply", reviewReply);

module.exports = router;
