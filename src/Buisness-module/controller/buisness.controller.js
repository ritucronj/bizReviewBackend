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
    const alreadyExists = await Business.findOne({ mobile: req.body.mobile });
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
    const userData = await Business.findOne({ id });
    if (!userData) {
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
    const updateData = await Business.findOneAndUpdate({ uId: id }, req.body, {
      new: true,
    });
    return res.send({ message: `Profile updated successfully.` });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const deleteBusiness = async (req, res) => {
  try {
    const id = req.params.id;
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
    if (rating || startDate || endDate) {
      const findReview = await Review.find(filter);
      return res.send(findReview);
    }
    if (name) {
      const findUser = await User.findOne(filter);
      const reviewFilter = { createdBy: findUser.uId };
      const findReviews = await Review.find(reviewFilter);
      if (findReviews.length === 0) {
        return res.status(404).send({ message: `Reviews not found` });
      }
      return res.send(findReviews);
    }
    if (email) {
      const findUser = await User.findOne(filter);
      const reviewFilter = { email: findUser.email };
      const findReviews = await Review.find(reviewFilter);
      if (findReviews.length === 0) {
        return res.status(404).send({ message: `Reviews not found` });
      }
      return res.send(findReviews);
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
    if (!tokenDataInvestor || tokenDataStartup)
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
