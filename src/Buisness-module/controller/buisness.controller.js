const Business = require("../models/business.model");
const Review = require("../../Reviewers-module/models/review.models");
const User = require("../../Reviewers-module/models/user.models");
const BusinessReviews = require("../../Buisness-module/models/buisness.review.model");
const {
  createBusinessValidation,
  updateBusinessValidation,
} = require("../services/validation");
const businessReview = require("../models/buisness.review.model");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { hashPassword } = require("../services/validation");
const {
  sendVerifyEMail,
  sendResetPasswordMail,
  sendResetSuccessMail,
} = require("../../utils/SendMail");
const { statusCodes } = require("../../utils/statusCodes");
const { jwtGenerate } = require("../../utils/util.function");
const randomstring = require("randomstring");
require("dotenv").config();
const {
  updateReviewValidation,
} = require("../../Reviewers-module/services/Validation-handler");
const createBusiness = async (req, res) => {
  try {
    const { error } = createBusinessValidation(req.body);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }
    const alreadyExists = await Business.findOne({ email: req.body.email });
    if (alreadyExists !== null) {
      return res.status(400).send({ messgae: `Account already registered` });
    }
    req.body.uId = uuidv4();
    const createData = await Business.create(req.body);
    sendVerifyEMail(createData.firstName, createData.email, createData.uId);
    await businessReview.create({ buisnessId: createData.uId });
    return res.send({ createData });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const ssoSignBuisness = async (req, res) => {
  try {
    let identify = req.query.key;
    if (identify.toLowerCase() === "google") {
      let { given_name, family_name, picture, email, email_verified, hd } =
        req.body;
      if (email_verified) {
        const saveUserData = new Promise(async (resolve, reject) => {
          const findUser = await Business.findOne({ email: email });
          const registeredUser = findUser !== null ? true : false;
          if (registeredUser) {
            reject([
              findUser,
              jwtGenerate({ userId: findUser.uId }, "secret", {
                expiresIn: "24H",
              }),
            ]);
          } else {
            resolve(
              await Business.create({
                companyName: hd,
                firstName: given_name,
                lastName: family_name,
                email: email,
                logo: picture,
              })
            );
          }
        });
        saveUserData
          .then((data) => {
            let payload = { userId: data.uId };
            const token = jwtGenerate(payload, "secret", {
              expiresIn: "24H",
            });
            return res
              .status(statusCodes[201].value)
              .send({ data: data, token: token });
          })
          .catch((dataArr) => {
            return res
              .status(statusCodes[200].value)
              .send({ data: dataArr[0], token: dataArr[1] });
          });
      } else {
        return res
          .status(statusCodes[400].value)
          .send({ msg: "invalid request" });
      }
    }
  } catch (error) {
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await Business.findOne({ uId: id });
    if (!userData) {
      return res.status(404).send({ message: `User not found` });
    }
    const updateFlag = await Business.findOneAndUpdate(
      { uId: id },
      { $set: { isEmailVerfied: true } },
      { new: true }
    );
    return res.send({ msg: `Email verified.` });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const setBusinessPassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { password } = req.body;
    const securePass = await hashPassword(password);
    const setPass = await Business.findOneAndUpdate(
      { uId: id },
      { password: securePass }
    );
    return res.send({ message: `Password added successfully.` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const loginBusiness = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await Business.findOne({ email });
    if (!userData) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ _id: userData._id }, process.env.JWT_SECRET);
    return res.json({ token: token, data: userData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const getBusiness = async (req, res) => {
  try {
    const id = req.params.id;
    const userData = await Business.findOne({ uId: id });

    if (!userData || userData.isDeleted === true) {
      return res.status(404).send({ message: `User not found.` });
    }
    return res.send({ userData });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const updateBusinessProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const { error } = updateBusinessValidation(req.body);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }
    if (req.body.password) {
      req.body.password = await hashPassword(req.body.password);
    }
    const updateData = await Business.findOneAndUpdate(
      { uId: id },
      { $set: req.body },
      {
        new: true,
      }
    );
    return res.send({ message: `Profile updated successfully.` });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const deleteBusiness = async (req, res) => {
  try {
    const id = req.params.id;
    const checkUser = await Business.findOne({ uId: id });
    if (!checkUser || checkUser.isDeleted === true) {
      return res.status(404).send({ message: `User not found.` });
    }
    const deleteProfile = await Business.findOneAndUpdate(
      { uId: id },
      { $set: { isDeleted: true } },
      { new: true }
    );
    return res.send({ message: `Account deleted successfully.` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const searchReviews = async (req, res) => {
  try {
    const { name, email, rating, startDate, endDate } = req.query;
    if (name && startDate && endDate && rating) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { rating: parseInt(rating) },
          { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && rating) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [{ createdBy: findUser }, { rating: parseInt(rating) }],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (email && startDate && endDate && rating) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { rating: parseInt(rating) },
          { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && rating) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [{ createdBy: findUser }, { rating: parseInt(rating) }],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && startDate && endDate) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && rating) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [{ createdBy: findUser }, { rating: parseInt(rating) }],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (email && startDate && endDate) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && rating) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [{ createdBy: findUser }, { rating: parseInt(rating) }],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (email && rating) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const reviews = await Review.find({
        $and: [{ createdBy: findUser }, { rating: parseInt(rating) }],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    const filter = {};
    if (name) {
      filter.name = new RegExp(name, "i");
    }

    if (email) {
      filter.email = new RegExp(email, "i");
    }

    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lt: new Date(endDate) };
    }
    if (startDate || endDate) {
      const reviews = await Review.find(filter)
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");

      return res.status(200).send(reviews);
    }
    if (rating) {
      const reviews = await Review.find({ rating: rating })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");

      return res.status(200).send(reviews);
    }
    if (name) {
      const findUser = await User.findOne(filter);
      const reviews = await Review.find({ createdBy: findUser })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");

      return res.status(200).send(reviews);
    }
    if (email) {
      const findUser = await User.findOne(filter);
      const reviews = await Review.find({ createdBy: findUser })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");

      return res.status(200).send(reviews);
    }
    if (!(name && email && startDate && endDate && rating)) {
      const reviews = await Review.find()
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "user",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    return res.status(404).send({ message: `No matching results found` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const forgotPass = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await Business.findOne({ email: email });
    if (userData) {
      const randomString = randomstring.generate();
      const data = await Business.updateOne(
        { email: email },
        { $set: { token: randomString } }
      );
      sendResetPasswordMail(userData.firstName, userData.email, randomString);
      return res.send(`Mail sent. Please check your inbox.`);
    }
    if (!userData) return res.status(400).send({ msg: `User doesn't exist` });
  } catch (error) {
    return res.status(500).send({ msg: `Internal Server Error` });
  }
};

const resetPass = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await Business.findOne({ token: token });
    if (tokenData) {
      const password = req.body.password;
      const newPassword = await hashPassword(password);
      const userData = await Business.findByIdAndUpdate(
        { _id: tokenData._id },
        { $set: { password: newPassword, token: "" } },
        { new: true }
      );
      sendResetSuccessMail(tokenData.firstName, tokenData.email);
      return res.send({ msg: `Password has been reset.`, data: userData });
    }
    if (!tokenData)
      return res.status(400).send({ msg: `Token invalid/expired.` });
  } catch (error) {
    return res.status(500).send({ msg: `Internal Server Error` });
  }
};

const reviewReply = async (req, res) => {
  // try {
  //   const reviewId = req.params.reviewId;
  //   const userId = req.body.userId;
  //   const createdById = req.params.createdBy;
  //   const replyMessage = req.body.reply;

  //   const businessReview = await Review.find();
  //   let reply = [];
  //   businessReview.map((item) => {
  //     item.reviews &&
  //       item.reviews.map((item2) => {
  //         let reply1 = item2.replies;
  //         if (item2.uId == reviewId) {
  //           reply1.push({
  //             userId: userId,
  //             replyMessage: replyMessage,
  //             timestamps: new Date(),
  //           });
  //           reply = reply1;
  //         }
  //       });
  //     console.log(reply);
  //   });
  //   console.log(reply);

  //   // BusinessReviews.findOneAndUpdate(
  //   //   {
  //   //     buisnessId: id,
  //   //   },
  //   //   { $set: item }
  //   // );
  //   // // await businessReview.save();
  //   // return res.send({ msg: "Reply added successfully", data: businessReview });
  //   // console.log(businessReview);
  //   // c;
  //   const { error } = updateReviewValidation(req.body);
  //   if (error)
  //     return res
  //       .status(statusCodes[400].value)
  //       .send({ msg: error.details[0].message });
  //   const checkReview = new Promise(async (resolve, reject) => {
  //     const findReviewAndUpdate = await Review.updateOne(
  //       {
  //         createdBy: createdById,
  //         "reviews.uId": reviewId,
  //       },
  //       {
  //         $push: {
  //           "reviews.$.replies": req.body,
  //         },
  //       },
  //       {
  //         new: true,
  //       }
  //     );
  //     const error = findReviewAndUpdate.matchedCount == 0 ? true : false;
  //     if (error) reject(new Error("No Reviews Found"));
  //     resolve(findReviewAndUpdate);
  //   });
  //   checkReview
  //     .then((data) => {
  //       return res.status(statusCodes[200].value).send({ data: data });
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       return res.status(statusCodes[400].value).send({ msg: err.message });
  //     });
  // } catch (error) {
  //   console.log(error.message);
  //   return res.status(500).send({ msg: error.message });
  // }
  try {
    const { createdBy, description } = req.body;

    // Find the review by ID and add the new reply to the replies array
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $push: { replies: { createdBy, description, date: new Date() } },
      },
      { new: true } // Return the updated document
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(201).json({ message: "Reply added successfully", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
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
};
