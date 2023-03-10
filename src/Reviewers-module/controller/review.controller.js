const review = require("../models/review.models");
const user = require("../models/user.models");
const { statusCodes } = require("../services/statusCodes");
const { updateReviewValidation } = require("../services/Validation-handler");
const { v4: uuidv4 } = require("uuid");

const createCompanyReview = async (req, res) => {
  try {
    // Get the review data from the request body
    const {
      title,
      rating,
      description,
      dateOfExperience,
      status,
      isDeleted,
      replies,
    } = req.body;
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
      replies,
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

// const readReviewById = async (req, res) => {
//   try {
//     let reviewId = req.params.review;
//     let userId = req.params.user;
//     const checkReview = new Promise(async (resolve, reject) => {
//       const findReview = await review.findOne(
//         {
//           $and: [{ createdBy: userId }, { "reviews.uId": reviewId }],
//         },
//         {
//           "reviews.$": 1,
//         }
//       );
//       if (findReview.reviews[0].isDeleted === true)
//         reject(new Error("Something went wrong"));
//       const error = findReview === null ? true : false;
//       if (error) reject(new Error("No Review Found"));
//       resolve(findReview);
//     });
//     checkReview
//       .then((result) => {
//         return res.status(statusCodes[200].value).send({ data: result });
//       })
//       .catch((err) => {
//         return res.status(statusCodes[400].value).send({ msg: err.message });
//       });
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(statusCodes[500].value)
//       .send({ status: statusCodes[500].message, msg: error.message });
//   }
// };

const readAllReviews = async (req, res) => {
  try {
    // Find all reviews from the database and populate their replies
    const reviews = await review
      .find({isDeleted: false})
      .populate("createdBy")
      .populate("businessId");
    console.log(reviews);
    // Return the reviews as the response
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const readAllReviewsByUser=async(req,res)=>{
  const userId = req.params.userId;
  try {
    const reviews = await review.find({ createdBy: userId,isDeleted: false }).populate("businessId").populate("createdBy");
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

const updateCompanyReview=async (req, res) => {
  try {
    const { title, description, rating, dateOfExperience,status,isDeleted } = req.body;
    const reviewData = await review.findById(req.params.reviewId);

    if (!reviewData) {
      return res.status(404).json({ message: 'ReviewData not found' });
    }

    reviewData.title = title || reviewData.title;
    reviewData.description = description || reviewData.description;
    reviewData.rating = rating || reviewData.rating;
    reviewData.dateOfExperience = dateOfExperience || reviewData.dateOfExperience;
    reviewData.status = status || reviewData.status;
    reviewData.isDeleted = isDeleted || reviewData.isDeleted;

    const updatedReviewData = await reviewData.save();
    res.json(updatedReviewData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}

// const recentReviews = async (req, res) => {
//   try {
//     let userId = req.params.Id;
//     const checkRecentReviews = new Promise(async (resolve, reject) => {
//       const getRecentReviews = await review.aggregate([
//         {
//           $match: {
//             $and: [{ createdBy: userId }, { isUserActive: true }],
//           },
//         },
//         {
//           $project: {
//             reviews: {
//               $filter: {
//                 input: "$reviews",
//                 as: "review",
//                 cond: { $eq: ["$$review.isDeleted", false] },
//               },
//             },
//           },
//         },
//         {
//           $unwind: "$reviews",
//         },
//         {
//           $sort: {
//             "reviews.createdAt": -1,
//           },
//         },
//         // {
//         //     "$limit": 2
//         // }
//       ]);
//       const error = getRecentReviews.length == 0 ? true : false;
//       if (error) reject(new Error("No Documents Found"));
//       resolve(getRecentReviews);
//     });
//     checkRecentReviews
//       .then((result) => {
//         return res.status(statusCodes[200].value).send({ data: result });
//       })
//       .catch((err) => {
//         return res.status(statusCodes[400].value).send({ msg: err.message });
//       });
//   } catch (error) {
//     return res
//       .status(statusCodes[500].value)
//       .send({ status: statusCodes[500].message, msg: error.message });
//   }
// };

// const updateCompanyReview = async (req, res) => {
//   try {
//     let reviewId = req.params.review;
//     let userId = req.params.user;
//     const { error } = updateReviewValidation(req.body);
//     if (error)
//       return res
//         .status(statusCodes[400].value)
//         .send({ msg: error.details[0].message });
//     const checkReview = new Promise(async (resolve, reject) => {
//       const findReviewAndUpdate = await review.updateOne(
//         {
//           createdBy: userId,
//           "reviews.uId": reviewId,
//         },
//         {
//           $set: {
//             "reviews.$.title": req.body.title,
//             "reviews.$.description": req.body.description,
//             "reviews.$.rating": req.body.rating,
//             "reviews.$.dateOfExperience": req.body.dateOfExperience,
//           },
//         },
//         {
//           new: true,
//         }
//       );
//       const error = findReviewAndUpdate.matchedCount == 0 ? true : false;
//       if (error) reject(new Error("No Reviews Found"));
//       resolve(findReviewAndUpdate);
//     });
//     checkReview
//       .then((data) => {
//         return res.status(statusCodes[200].value).send({ data: data });
//       })
//       .catch((err) => {
//         console.error(err);
//         return res.status(statusCodes[400].value).send({ msg: err.message });
//       });
//   } catch (error) {
//     return res
//       .status(statusCodes[500].value)
//       .send({ status: statusCodes[500].message, msg: error.message });
//   }
// };

// const deleteReviewById = async (req, res) => {
//   try {
//     let reviewId = req.params.review;
//     let userId = req.params.user;
//     const { error } = updateReviewValidation(req.body);
//     if (error)
//       return res
//         .status(statusCodes[400].value)
//         .send({ msg: error.details[0].message });
//     const checkReview = new Promise(async (resolve, reject) => {
//       const findReviewAndUpdate = await review.findOneAndUpdate(
//         {
//           $and: [
//             { createdBy: userId },
//             { "reviews.uId": reviewId },
//             { "reviews.isDeleted": false },
//           ],
//         },
//         {
//           $set: {
//             "reviews.$.isDeleted": true,
//           },
//         },
//         {
//           new: true,
//         }
//       );
//       const error = findReviewAndUpdate === null ? true : false;
//       if (error) reject(new Error("No Reviews Found"));
//       resolve("Review Successfully Deleted");
//     });
//     checkReview
//       .then((data) => {
//         return res.status(statusCodes[200].value).send({ data: data });
//       })
//       .catch((err) => {
//         console.error(err);
//         return res.status(statusCodes[400].value).send({ msg: err.message });
//       });
//   } catch (error) {
//     return res
//       .status(statusCodes[500].value)
//       .send({ status: statusCodes[500].message, msg: error.message });
//   }
// };

// const recentReviewsPublic = async (req, res) => {
//   try {
//     const findUsers = await user.find();
//     const resultArr = [];
//     for (let i = 0; i < findUsers.length; i++) {
//       const reviews = await review.aggregate([
//         {
//           $match: {
//             createdBy: findUsers[i].uId,
//           },
//         },
//         {
//           $project: {
//             reviews: {
//               $filter: {
//                 input: "$reviews",
//                 as: "review",
//                 cond: { $eq: ["$$review.isDeleted", false] },
//               },
//             },
//           },
//         },

//         {
//           $unwind: "$reviews",
//         },
//         {
//           $sort: {
//             "reviews.createdAt": -1,
//           },
//         },
//         {
//           $addFields: {
//             userDetails: findUsers[i],
//           },
//         },
//       ]);
//       // console.log(reviews);
//       if (reviews.length === 0) {
//         continue;
//       } else {
//         resultArr.push(reviews[0]);
//       }
//     }
//     return res.status(statusCodes[200].value).send({ data: resultArr });
//   } catch (error) {
//     return res
//       .status(statusCodes[500].value)
//       .send({ status: statusCodes[500].message, msg: error.message });
//   }
// };

module.exports = {
  createCompanyReview,
  // readReviewById,
  readAllReviews,
  readAllReviewsByUser,
  // recentReviews,
  updateCompanyReview
  // deleteReviewById,
  // recentReviewsPublic,
};
