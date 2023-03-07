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
    // console.log(name, rating);
    if (name && startDate && endDate && rating) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const userData = {
        email: findUser?.email,
        name: findUser?.name,
        profilePicture: findUser?.profilePicture,
        userType: findUser?.userType,
        isDeleted: findUser?.isDeleted,
        createdAt: findUser?.createdAt,
        updatedAt: findUser?.updatedAt,
      };
      const reviewFilter = {
        createdBy: findUser?.uId ? findUser.uId : findUser?._id,
      };
      const findReviews = await Review.find({
        $and: [
          reviewFilter,
          { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        ],
      });
      const data = [];
      findReviews.map((item) => {
        const review = [];
        item.reviews &&
          item.reviews.map((item2) => {
            if (item2.rating == parseInt(rating)) {
              review.push(item2);
            }
          });
        item.reviews = review;
        item.createdBy = userData;
        if (review.length && userData !== null) {
          data.push(item);
        }
      });
      return res.send(data);
    }
    if (name && startDate && endDate) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const userData = {
        email: findUser?.email,
        name: findUser?.name,
        profilePicture: findUser?.profilePicture,
        userType: findUser?.userType,
        isDeleted: findUser?.isDeleted,
        createdAt: findUser?.createdAt,
        updatedAt: findUser?.updatedAt,
      };
      const reviewFilter = {
        createdBy: findUser?.uId ? findUser.uId : findUser?._id,
      };
      const findReviews = await Review.find({
        $and: [
          reviewFilter,
          { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        ],
      });
      const data = [];
      findReviews.map((item) => {
        item.createdBy = userData;
        data.push(item);
      });
      return res.send(data);
    }
    if (email && startDate && endDate) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const userData = {
        email: findUser?.email,
        name: findUser?.name,
        profilePicture: findUser?.profilePicture,
        userType: findUser?.userType,
        isDeleted: findUser?.isDeleted,
        createdAt: findUser?.createdAt,
        updatedAt: findUser?.updatedAt,
      };
      const reviewFilter = {
        createdBy: findUser?.uId ? findUser.uId : findUser?._id,
      };
      const findReviews = await Review.find({
        $and: [
          reviewFilter,
          { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } },
        ],
      });
      const data = [];
      findReviews.map((item) => {
        item.createdBy = userData;
        data.push(item);
      });
      return res.send(data);
    }
    if (name && rating) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const userData = {
        email: findUser?.email,
        name: findUser?.name,
        profilePicture: findUser?.profilePicture,
        userType: findUser?.userType,
        isDeleted: findUser?.isDeleted,
        createdAt: findUser?.createdAt,
        updatedAt: findUser?.updatedAt,
      };
      const reviewFilter = {
        createdBy: findUser?.uId ? findUser.uId : findUser?._id,
      };
      const findReviews = await Review.find(reviewFilter);
      const data = [];
      findReviews.map((item) => {
        const review = [];
        item.reviews &&
          item.reviews.map((item2) => {
            if (item2.rating == parseInt(rating)) {
              review.push(item2);
            }
          });
        item.reviews = review;
        item.createdBy = userData;
        if (review.length && userData !== null) {
          data.push(item);
        }
      });
      return res.send(data);
    }
    if (email && rating) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const userData = {
        email: findUser?.email,
        name: findUser?.name,
        profilePicture: findUser?.profilePicture,
        userType: findUser?.userType,
        isDeleted: findUser?.isDeleted,
        createdAt: findUser?.createdAt,
        updatedAt: findUser?.updatedAt,
      };
      const reviewFilter = {
        createdBy: findUser?.uId ? findUser.uId : findUser?._id,
      };
      const findReviews = await Review.find(reviewFilter);
      const data = [];
      findReviews.map((item) => {
        const review = [];
        item.reviews &&
          item.reviews.map((item2) => {
            if (item2.rating == parseInt(rating)) {
              review.push(item2);
            }
          });
        item.reviews = review;
        item.createdBy = userData;
        if (review.length && userData !== null) {
          data.push(item);
        }
      });
      return res.send(data);
    }
    const filter = {};
    if (name) {
      filter.name = new RegExp(name, "i");
    }

    if (email) {
      filter.email = new RegExp(email, "i");
    }

    if (rating) {
      filter.rating = parseInt(rating);
    }

    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lt: new Date(endDate) };
    }
    if (startDate || endDate) {
      const findUser = await User.find();
      const findReview = await Review.find(filter);
      const data = [];
      findReview.map((item) => {
        let userData = null;
        findUser.map((user) => {
          if (item.createdBy == JSON.stringify(user?._id)?.split('"')[1]) {
            userData = {
              email: user?.email,
              name: user?.name,
              profilePicture: user?.profilePicture,
              userType: user?.userType,
              isDeleted: user?.isDeleted,
              createdAt: user?.createdAt,
              updatedAt: user?.updatedAt,
            };
          }
        });
        if (userData !== null) {
          item.createdBy = JSON.stringify(userData);
          data.push(item);
        }
      });
      return res.send(data);
    }
    if (rating) {
      const findUser = await User.find();
      const findReview = await Review.find();
      const data = [];
      findReview.map((item) => {
        const review = [];
        item.reviews &&
          item.reviews.map((item2) => {
            if (item2.rating == parseInt(rating)) {
              review.push(item2);
            }
          });
        item.reviews = review;
        let userData = null;
        findUser.map((user) => {
          if (item.createdBy == JSON.stringify(user?._id)?.split('"')[1]) {
            userData = {
              email: user?.email,
              name: user?.name,
              profilePicture: user?.profilePicture,
              userType: user?.userType,
              isDeleted: user?.isDeleted,
              createdAt: user?.createdAt,
              updatedAt: user?.updatedAt,
            };
          }
        });
        if (userData !== null) {
          item.createdBy = JSON.stringify(userData);
          data.push(item);
        }
      });
      return res.send(data);
    }
    if (name) {
      const findUser = await User.findOne(filter);
      const userData = {
        email: findUser?.email,
        name: findUser?.name,
        profilePicture: findUser?.profilePicture,
        userType: findUser?.userType,
        isDeleted: findUser?.isDeleted,
        createdAt: findUser?.createdAt,
        updatedAt: findUser?.updatedAt,
      };
      const reviewFilter = {
        createdBy: findUser?.uId ? findUser.uId : findUser?._id,
      };
      const findReviews = await Review.find(reviewFilter);
      const data = [];
      findReviews.map((item) => {
        item.createdBy = JSON.stringify(userData);
        data.push(item);
      });
      return res.send(data);
    }
    if (email) {
      const findUser = await User.findOne(filter);
      const userData = {
        email: findUser?.email,
        name: findUser?.name,
        profilePicture: findUser?.profilePicture,
        userType: findUser?.userType,
        isDeleted: findUser?.isDeleted,
        createdAt: findUser?.createdAt,
        updatedAt: findUser?.updatedAt,
      };
      const reviewFilter = { email: findUser.email };
      const findReviews = await Review.find(reviewFilter);
      if (findReviews.length === 0) {
        return res.status(404).send({ message: `Reviews not found` });
      }
      const data = [];
      findReviews.map((item) => {
        item.createdBy = JSON.stringify(userData);
        data.push(item);
      });
      return res.send(data);
    }
    if (!(name && email && startDate && endDate && rating)) {
      const findUser = await User.find();
      const reviews = await Review.find();
      const data = [];
      reviews.map((review) => {
        let userData = null;
        findUser.map((user) => {
          if (review.createdBy == JSON.stringify(user?._id)?.split('"')[1]) {
            userData = {
              email: user?.email,
              name: user?.name,
              profilePicture: user?.profilePicture,
              userType: user?.userType,
              isDeleted: user?.isDeleted,
              createdAt: user.createdAt,
              updatedAt: user?.updatedAt,
            };
          }
        });
        if (userData !== null) {
          review.createdBy = JSON.stringify(userData);
          data.push(review);
        }
      });
      if (reviews.length === 0) {
        return res.status(404).send({ message: `Reviews not found` });
      }
      return res.send(data);
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
};
