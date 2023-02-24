const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    uId: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    isEmailVerfied: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", businessSchema);
