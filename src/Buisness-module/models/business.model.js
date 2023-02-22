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
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
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
<<<<<<< HEAD
    isEmailVerfied: {
      type: Boolean,
      default: false,
    },
=======
    location:{
      type:String
    }
>>>>>>> 0d1099c154a23afdd1cca6efd17a5eb634cb0c54
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", businessSchema);
