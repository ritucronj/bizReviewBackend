const mongoose = require("mongoose");

const reviews = new mongoose.Schema(
  {
    uId: {
      type: String,
    },
    reviewedBy: {
      type: String,
    },
    title: {
      type: String,
    },
    rating: {
      type: Number,
    },
    description: {
      type: String,
    },
    dateOfExperience: {
      type: String,
    },
  },
  { timestamps: true }
);

const buisnessReview = new mongoose.Schema(
  {
    uId: {
      type: String,
    },
    buisnessId: {
      type: String,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: [reviews],
    },
    userData: {
      type: Object,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("buisnessReview", buisnessReview);
