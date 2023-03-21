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
  deleteBusinessPermanently,
  deleteMultipleBusinessPermanently,
  deleteBusinessTemporarily,
  updateBusinessStatus,
  searchReviews,
  forgotPass,
  resetPass,
  reviewReply,
  getAllBusiness,
  searchBusinessRequests,
  searchApprovedBusiness,
  searchBusinessWithReviews,
  createBusinessByUser,
  searchBusinessRequestsByReviewer,
  searchSubscriptions,
  deleteSubscription,
  deleteMultipleSubscription,
  contactUser,
} = require("../controller/buisness.controller");
const router = express.Router();

router.post("/business", createBusiness);

router.post("/createBusinessByUser/:userId", createBusinessByUser);

router.get("/verify-email", verifyEmail);

router.put("/setpassword/:id", setBusinessPassword);

router.post("/business/login", loginBusiness);

router.get("/business/:id", getBusiness);

router.post("/business/google", ssoSignBuisness);

router.put("/business/:id", updateBusinessProfile);

router.get("/getAllBusiness", getAllBusiness);

router.get("/searchBusinessRequests", searchBusinessRequests);

router.get(
  "/searchBusinessRequestsByReviewer",
  searchBusinessRequestsByReviewer
);

router.get("/searchApprovedBusinesses", searchApprovedBusiness);

router.get("/searchBusinessWithReviews", searchBusinessWithReviews);

router.get("/searchSubscriptions", searchSubscriptions);

router.put("/deleteBusinessPermanently/:id", deleteBusinessPermanently);

router.put("/deleteSubscription/:id", deleteSubscription);

router.put("/deleteMultipleSubscription", deleteMultipleSubscription);

router.put(
  "/deleteMultipleBusinessPermanently",
  deleteMultipleBusinessPermanently
);

router.put("/deleteBusinessTemporarily/:id", deleteBusinessTemporarily);

router.put("/updateBusinessStatus/:id", updateBusinessStatus);

router.get("/review-search", searchReviews);

router.post("/forgot-password", forgotPass);

router.put("/reset-password", resetPass);

router.post("/reviews/:id/reply", reviewReply);
router.post("/contactUser", contactUser);

module.exports = router;
