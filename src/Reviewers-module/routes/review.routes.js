const express = require("express");
const {
  createCompanyReview,
  readAllReviews,
  readAllReviewsByUser,
  updateCompanyReview,
  searchAllReviewsByUser,
  getReviewById,
} = require("../controller/review.controller");
const router = express.Router();
const review = require("../models/review.models");

//test API
router.get("/getAll", async (req, res) => {
  const data = await review.find();
  res.send(data);
});

router.post("/createCompanyReview/:Id/:businessId", createCompanyReview);
router.get("/getReviewById/:id", getReviewById);
router.get("/getAllReviews", readAllReviews);
router.get("/getAllReviewsByUser/:userId", readAllReviewsByUser);
router.get("/searchAllReviewsByUser/:userId", searchAllReviewsByUser);
router.put("/updateReview/:reviewId", updateCompanyReview);
// router.get("/recentReviews/:Id", recentReviews);
// router.delete("/deleteReviewById/:review/:user", deleteReviewById);
// router.get("/recentReviewsPublic", recentReviewsPublic);

module.exports = router;
