const Business = require("../models/business.model");
const { createBusinessValidation } = require("../services/validation");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { hashPassword } = require("../services/validation");
const { sendVerifyEMail } = require("../../utils/SendMail");
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
    return res.send({ createData });
  } catch (error) {
    return res.status(500).send({ messgae: `Internal Server Error` });
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
    return res.json({ token });
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

module.exports = {
  createBusiness,
  loginBusiness,
  verifyEmail,
  setBusinessPassword,
  getBusiness,
};
