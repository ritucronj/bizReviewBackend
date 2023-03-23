const review = require("../models/review.models");
const user = require("../models/user.models");
const { statusCodes } = require("../services/statusCodes");
const { updateReviewValidation } = require("../services/Validation-handler");
const { v4: uuidv4 } = require("uuid");
const businessModel = require("../../Buisness-module/models/business.model");
const { find } = require("../models/review.models");

const createCompanyReview = async (req, res) => {
  try {
    // Get the review data from the request body
    const { title, rating, description, dateOfExperience, status, isDeleted } =
      req.body;
    const createdBy = req.params.Id;
    const businessId = req.params.businessId;

    // Create a new Review object with the data
    const reviews = new review({
      title,
      createdBy,
      businessId,
      rating,
      description,
      dateOfExperience,
      status,
      isDeleted,
    });

    // Save the review to the database
    const savedReview = await reviews.save();

    // Return the saved review as the response
    res.status(201).json(savedReview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const readAllReviews = async (req, res) => {
  try {
    // Find all reviews from the database and populate their replies
    const reviews = await review
      .find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .populate("createdBy")
      .populate("businessId");

    // Return the reviews as the response
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const readAllReviewsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const reviews = await review
      .find({ createdBy: userId, isDeleted: false })
      .populate("businessId")
      .populate("createdBy");
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const searchAllReviewsByUser = async (req, res) => {
  const userId = req.params.userId;
  const { fromDate, toDate, search, rating } = req.query;
  const filters = { createdBy: userId, isDeleted: false };
  if (fromDate && !toDate)
    filters.dateOfExperience = { $gte: new Date(fromDate) };
  if (toDate && !fromDate) {
    if (!filters.dateOfExperience) filters.dateOfExperience = {};
    filters.dateOfExperience["$lte"] = new Date(toDate).setDate(
      new Date(toDate).getDate() + 1
    );
  }
  if (fromDate && toDate) {
    filters.dateOfExperience = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate).setDate(new Date(toDate).getDate() + 1),
    };
  }
  if (search) {
    const regex = new RegExp(search, "i");
    const findBusiness = await businessModel.findOne({
      $or: [{ companyName: regex }],
    });

    filters.businessId = findBusiness && findBusiness._id.toString();
  }
  if (rating) filters.rating = Number(rating);
  try {
    const reviews = await review
      .find(filters)
      .populate("businessId")
      .populate("createdBy");
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateCompanyReview = async (req, res) => {
  try {
    const { title, description, rating, dateOfExperience, status, isDeleted } =
      req.body;
    const reviewData = await review.findById(req.params.reviewId);

    if (!reviewData) {
      return res.status(404).json({ message: "ReviewData not found" });
    }

    reviewData.title = title || reviewData.title;
    reviewData.description = description || reviewData.description;
    reviewData.rating = rating || reviewData.rating;
    reviewData.dateOfExperience =
      dateOfExperience || reviewData.dateOfExperience;
    reviewData.status = status || reviewData.status;
    reviewData.isDeleted = isDeleted || reviewData.isDeleted;

    const updatedReviewData = await reviewData.save();
    res.json(updatedReviewData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getReviewById = async (req, res) => {
  const id = req.params.id;
  try {
    const review = await review.findOne({ _id: id, isDeleted: false });
    if (!review) {
      res.status(404).json({ message: "Review not found" });
    } else {
      res.status(200).json(review);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const importCompanyReview = async (req, res) => {
  try {
    let reviews = req.body;
    const businessId = req.params.businessId;
    // let reviewsData = [];
    reviews.filter(async (item) => {
      let createdBy = await user.find({ email: item.email });
      item.createdBy = createdBy[0]?._id.valueOf();
      item.businessId = businessId;
      // reviewsData.push(
      try {
        const reviewData = new review({
          title: item.title,
          createdBy: item.createdBy,
          businessId: businessId,
          rating: item.rating,
          description: item.description,
          dateOfExperience: item.dateofexperience,
        });
        // );
        const savedReview = await reviewData.save();
        res.status(201).json("Reviews imported successfully");
      } catch (error) {
        res.status(400).send("Invalid Data");
      }
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

module.exports = {
  createCompanyReview,
  readAllReviews,
  readAllReviewsByUser,
  searchAllReviewsByUser,
  updateCompanyReview,
  getReviewById,
  importCompanyReview,
};
