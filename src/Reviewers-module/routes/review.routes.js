const express = require("express");
const { createCompanyReview, readReviewById, updateCompanyReview, readAllReviewsByUser, deleteReviewById } = require("../controller/review.controller")
const router = express.Router();

router.post("/createCompanyReview/:Id", createCompanyReview);
router.get("/getReviewById/:review/:user", readReviewById);
router.get('/getAllReviewsByUser/:user', readAllReviewsByUser);
router.put("/updateReview/:review/:user", updateCompanyReview);
router.delete('/deleteReviewById/:review/:user', deleteReviewById);

module.exports = router;