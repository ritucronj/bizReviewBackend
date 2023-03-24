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
  sendStatusUpdateMail,
  contactUserEmail,
} = require("../../utils/SendMail");
const { statusCodes } = require("../../utils/statusCodes");
const { jwtGenerate } = require("../../utils/util.function");
const randomstring = require("randomstring");
require("dotenv").config();
const {
  updateReviewValidation,
} = require("../../Reviewers-module/services/Validation-handler");
const { request } = require("express");
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

const createBusinessByUser = async (req, res) => {
  try {
    if (req.params.userId) {
      req.body.uId = uuidv4();
      req.body.createdByUser = true;
      req.body.createdBy = req.params.userId;
      // Create a new business object with the request body

      const businessFound= await Business.findOne({website:req.body.website})
      console.log('business',businessFound)
       if(!businessFound){
        const business = await new Business(req.body);

        // Save the business object to the database
        const savedBusiness = await business.save();
  
        // Send the saved business object in the response
        res.status(201).json(savedBusiness);
       }else{
        res.status(400).send("Already Exists");
       }
    } else {
      res.status(500).send("Server Error");
    }
  } catch (err) {
    res.status(500).send("Server Error");
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
          if (registeredUser && !findUser.isDeleted) {
            reject([
              findUser,
              jwtGenerate({ userId: findUser.uId }, "secret", {
                expiresIn: "24H",
              }),
            ]);
          } else if (!registeredUser) {
            resolve(
              await Business.create({
                companyName: hd,
                firstName: given_name,
                lastName: family_name,
                email: email,
                profilePicture: picture,
              })
            );
          } else {
            res.status(400).send({ message: "user deleted" });
          }
        });
        saveUserData
          .then((data) => {
            let payload = { userId: data.uId };
            const token = jwtGenerate(payload, "secret", {
              expiresIn: "24H",
            });
            if (data.isApproved) {
              return res
                .status(statusCodes[201].value)
                .send({ data: data, token: token });
            } else {
              return res
                .status(statusCodes[201].value)
                .send({ data: data, message: "Not approved" });
            }
          })
          .catch((dataArr) => {
            console.log("data", dataArr[0]);
            if (dataArr[0].isApproved) {
              return res
                .status(statusCodes[200].value)
                .send({ data: dataArr[0], token: dataArr[1] });
            } else {
              return res
                .status(statusCodes[200].value)
                .send({ data: dataArr[0], message: "Not approved" });
            }
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
    const { password } = req.body;
    const securePass = await hashPassword(password);
    const setPass = await Business.findOneAndUpdate({uId:req.params.id}, {
      password: securePass,
    });
    return res.send({ message: `Password added successfully.`,user:setPass });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const loginBusiness = async (req, res) => {
  console.log('body',req.body)
  try {
    const { email, password } = req.body;
    const userData = await Business.findOne({ email, isDeleted: false });
    console.log('helloo',password,userData)
    if (!userData) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
   
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!userData.isApproved) {
      return res.json({ data: userData, message: "Not Approved" });
    }
    const token = jwt.sign({ _id: userData._id }, process.env.JWT_SECRET);
    return res.json({ token: token, data: userData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const getAllBusiness = async (req, res) => {
  try {
    const businessData = await Business.find({ isDeleted: false });

    if (!businessData) {
      return res.status(404).send({ message: `User not found.` });
    }
    return res.status(200).send({ businessData });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const searchBusinessRequests = async (req, res) => {
  const { search, page, limit } = req.query; // the search query parameter and pagination parameters

  try {
    const businesses = await Business.find({
      $and: [
        { isDeleted: false },
        { isApproved: false },
        { rejected: false },
        { createdByUser: false },
        {
          $or: [
            { email: { $regex: new RegExp(search, "i") } }, // case-insensitive search by companyName
            { firstName: { $regex: new RegExp(search, "i") } }, // case-insensitive search by website
          ],
        },
      ],
    })
      .skip((page - 1) * limit) // calculate the number of documents to skip
      .limit(parseInt(limit)); // convert the limit parameter to a number and use it as the limit

    res.status(200).json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const searchBusinessRequestsByReviewer = async (req, res) => {
  const { search, page, limit } = req.query; // the search query parameter and pagination parameters

  try {
    const businesses = await Business.find({
      $and: [
        { isDeleted: false },
        { isApproved: false },
        { rejected: false },
        { createdByUser: true },
        {
          $or: [
            { website: { $regex: new RegExp(search, "i") } },
            { companyName: { $regex: new RegExp(search, "i") } },
          ],
        },
      ],
    })
      .populate("createdBy")
      .skip((page - 1) * limit) // calculate the number of documents to skip
      .limit(parseInt(limit));
    // convert the limit parameter to a number and use it as the limit

    res.status(200).json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const searchApprovedBusiness = async (req, res) => {
  const { search, page, limit, fromDate, toDate } = req.query; // the search query parameter and pagination parameters
  console.log('query',req.query)
  let query = {
    $and: [
      { isDeleted: false },
      { isApproved: true },
      { rejected: false },
      {
        $or: [
          { website: { $regex: new RegExp(search, "i") } },
          { companyName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
        ],
      },
    ],
  };

  
  if (fromDate && toDate) {
    query.createdAt = {
      // createdAt: {
        $gte: new Date(fromDate),
        $lte: new Date(toDate).setDate(new Date(toDate).getDate()+1),
      // },
    };
  }

  if (fromDate && !toDate) {
    query.createdAt = {
      // createdAt: {
        $gte: new Date(fromDate),
      // },
    };
  }

  if (!fromDate && toDate) {
    query.createdAt = {
      // createdAt: {
        $lte: new Date(toDate).setDate(new Date(toDate).getDate()+1),
      // },
    };
  }

  console.log('query',query)

  try {
    const businesses = await Business.find(query)
      .skip((page - 1) * limit) // calculate the number of documents to skip
      .limit(parseInt(limit)); // convert the limit parameter to a number and use it as the limit

    res.status(200).json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const searchBusinessWithReviews = async (req, res) => {
  const search = req.query.search; // the search query parameter

  try {
    const businesses = await Business.aggregate([
      {
        $match: {
          $and:[{isDeleted:false},{isApproved:true}],
          $or: [
            { companyName: { $regex: new RegExp(search, "i") } }, // case-insensitive search by companyName
            { website: { $regex: new RegExp(search, "i") } },
            { email: { $regex: new RegExp(search, "i") } },
             // case-insensitive search by website
          ],
        },
      },
      {
        $lookup: {
          from: "reviews", // the name of the Review collection
          localField: "_id",
          foreignField: "businessId",
          as: "reviews",
          pipeline: [
            { $match: { $expr: { $and: [  { $eq: [ "$isDeleted", false ] } ] } } }
          ],
        },
      },
    ]);

    res.status(200).send(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const searchSubscriptions = async (req, res) => {
  const { search, page, limit, fromDate, toDate } = req.query; // the search query parameter and pagination parameters

  let query = {
    $and: [
      { isDeleted: false },
      { isApproved: true },
      { rejected: false },
      {
        $or: [
          { email: { $regex: new RegExp(search, "i") } }, // case-insensitive search by companyName
          { firstName: { $regex: new RegExp(search, "i") } }, // case-insensitive search by website
        ],
      },
      {
        $or: [
          { planType: "gold" },
          { planType: "silver" },
          { planType: "platinum" },
          { planType: "diamond" },
        ],
      },
    ],
  };

  if (fromDate && toDate) {
    query.planPurchaseDate = {
      planPurchaseDate: {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      },
    };
  }

  if (fromDate && toDate) {
    query.planPurchaseDate = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate).setDate(new Date(toDate).getDate() + 1),
    };
  }

  if (fromDate && !toDate) {
    query.planPurchaseDate = {
      $gte: new Date(fromDate),
    };
  }

  if (!fromDate && toDate) {
    query.planPurchaseDate = {
      $lte: new Date(toDate).setDate(new Date(toDate).getDate() + 1),
    };
  }
  try {
    const businesses = await Business.find(query)
      .skip((page - 1) * limit) // calculate the number of documents to skip
      .limit(parseInt(limit)); // convert the limit parameter to a number and use it as the limit

    res.status(200).json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const getBusiness = async (req, res) => {
  try {
    const id = req.params.id;
    const userData = await Business.findOne({ id });

    if (!userData || userData.isDeleted === true) {
      return res.status(404).send({ message: `User not found.` });
    }
    return res.send({ userData });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};
const getBusinessById = async (req, res) => {
  try {
    const id = req.params.id;
    const userData = await Business.findOne({ _id: id });

    if (!userData || userData.isDeleted === true) {
      return res.status(404).send({ message: `User not found.` });
    }
    return res.send({ userData });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
  }
};

const updateBusinessProfile = async (req, res) => {
  console.log('test',req.params.id)
  try {
    const id = req.params.id;
    if (req.body.password) {
      req.body.password = await hashPassword(req.body.password);
    }
    const updateData = await Business.findByIdAndUpdate(
      id,
     req.body ,
      {
        new: true,
      }
    );
    console.log('updateData',updateData)
    return res?.status(200).send({ message: `Profile updated successfully.`,business:updateData });
  } catch (error) {
    return res?.status(500).send({ messgae: `Internal Server Error` });
  }
};

const deleteBusinessPermanently = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (business) {
      res.status(200).json(business);
    } else {
      res.status(400).send({ message: "Incorrect business id" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const deleteMultipleBusinessPermanently = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Business.updateMany(
      { _id: { $in: ids } },
      { isDeleted: true }
    );
    res.status(200).json({
      result: result,
      message: `${result.modifiedCount} updated successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const deleteBusinessTemporarily = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true }
    );
    res.status(200).json(business);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const deleteSubscription = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { planType: "free" },
      { new: true }
    );
    res.status(200).json(business);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const deleteMultipleSubscription = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Business.updateMany(
      { _id: { $in: ids } },
      { planType: "free" }
    );
    res.status(200).json({
      result: result,
      message: `${result.modifiedCount} updated successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const updateBusinessStatus = async (req, res) => {
  const { approved, rejected } = req.body;
  try {
    if (approved && !rejected) {
      console.log("inside first");
      const business = await Business.findByIdAndUpdate(
        req.params.id,
        { isApproved: true, rejected: false, status: "active" },
        { new: true }
      );
      sendStatusUpdateMail(business.firstName, business.email, "Approved");
      res.status(200).json(business);
    }
    if (rejected && !approved) {
      console.log("inside second");
      const business = await Business.findByIdAndUpdate(
        req.params.id,
        { isApproved: false, rejected: true, status: "inactive" },
        { new: true }
      );
      sendStatusUpdateMail(business.firstName, business.email, "Rejected");
      res.status(200).json(business);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
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
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && rating && startDate && !endDate) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { rating: parseInt(rating) },
          { createdAt: { $gte: new Date(startDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && rating && !startDate && endDate) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { rating: parseInt(rating) },
          { createdAt: { $lte: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
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
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (email && rating && startDate && !endDate) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { rating: parseInt(rating) },
          { createdAt: { $gte: new Date(startDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (email && rating && !startDate && endDate) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { rating: parseInt(rating) },
          { createdAt: { $lte: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (rating && startDate && !endDate) {
      const reviews = await Review.find({
        $and: [
          { rating: parseInt(rating) },
          { createdAt: { $gte: new Date(startDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (rating && !startDate && endDate) {
      const reviews = await Review.find({
        $and: [
          { rating: parseInt(rating) },
          { createdAt: { $lte: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }

    if (name && startDate && !endDate) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { createdAt: { $gte: new Date(startDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (name && !startDate && endDate) {
      const findUser = await User.findOne({ name: new RegExp(name, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { createdAt: { $lte: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }

    if (email && startDate && !endDate) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { createdAt: { $gte: new Date(startDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (email && !startDate && endDate) {
      const findUser = await User.findOne({ email: new RegExp(email, "i") });
      const reviews = await Review.find({
        $and: [
          { createdBy: findUser },
          { createdAt: { $lte: new Date(endDate) } },
        ],
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
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
            model: "Business",
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
            model: "Business",
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
            model: "Business",
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
            model: "Business",
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
    if (startDate && endDate) {
      const reviews = await Review.find(filter)
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
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
            model: "Business",
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
            model: "Business",
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
            model: "Business",
          },
        })
        .populate("createdBy");

      return res.status(200).send(reviews);
    }
    if (startDate) {
      const reviews = await Review.find({
        createdAt: { $gte: new Date(startDate) },
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
          },
        })
        .populate("createdBy");
      return res.status(200).send(reviews);
    }
    if (endDate) {
      const reviews = await Review.find({
        createdAt: { $lte: new Date(endDate) },
      })
        .populate("businessId")
        .populate({
          path: "replies",
          populate: {
            path: "createdBy",
            model: "Business",
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
            model: "Business",
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
  try {
    const { createdBy, description } = req.body;
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

const contactUser = async (req, res) => {
  try {
    const { name, email, mailBody } = req.body;
    contactUserEmail(name, email, mailBody);
    res.status(200).json({ data: "Mail Sent" });
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
  getAllBusiness,
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
  searchBusinessRequests,
  searchApprovedBusiness,
  searchBusinessWithReviews,
  createBusinessByUser,
  searchBusinessRequestsByReviewer,
  searchSubscriptions,
  deleteSubscription,
  deleteMultipleSubscription,
  contactUser,
  getBusinessById,
};
