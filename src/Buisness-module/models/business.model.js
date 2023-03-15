const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    uId: {
      type: String,
    },
    planType: {
      type: String,
      enum: ['free','silver', 'gold', 'platinum', 'diamond'],
      required: true,
      default:'free'
    },
    planPurchaseDate:{
      type:Date
    },
    isPlanExpired:{
     type:Boolean,
     default:true
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
      default: "",
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
      default: "",
    },
    isEmailVerfied: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
      default: "",
    },
    userType: {
      type: String,
      default: "buisness",
    },
    locationName: {
      type: String,
      trim: true,
      default: "",
    },
    locationId: {
      type: String,
      trim: true,
      default: "",
    },
    street: {
      type: String,
      trim: true,
      default: "",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active','inactive'],
      required: true,
      default:'inactive'
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    createdByUser:{
      type: Boolean,
      default: false,
    },
   createdBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", businessSchema);
