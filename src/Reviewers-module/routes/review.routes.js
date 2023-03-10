const express = require("express");
const {
  createCompanyReview,
  readReviewById,
  updateCompanyReview,
  readAllReviewsByUser,
  deleteReviewById,
  recentReviews,
  recentReviewsPublic,
} = require("../controller/review.controller");
const router = express.Router();
const review = require("../models/review.models");

//test API
router.get("/getAll", async (req, res) => {
  const data = await review.find();
  res.send(data);
});

router.post("/createCompanyReview/:Id/:businessId", createCompanyReview);
router.get("/getReviewById/:review/:user", readReviewById);
router.get("/getAllReviewsByUser/:user", readAllReviewsByUser);
router.get("/recentReviews/:Id", recentReviews);
router.put("/updateReview/:review/:user", updateCompanyReview);
router.delete("/deleteReviewById/:review/:user", deleteReviewById);
router.get("/recentReviewsPublic", recentReviewsPublic);

module.exports = router;
