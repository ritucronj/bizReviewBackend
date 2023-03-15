const mongoose = require('mongoose');

const user = new mongoose.Schema({
    uId: {
        type: String,
    },
    email: {
        type: String,
        // required: true
    },
    name: {
        type: String,
        // required: true
    },
    profilePicture: {
        type: String,
    },
    country: {
        type: String,
        // required: true
    },
    language: {
        type: String,
        // required: true
    },
    userType: {
        type: String,
        default: "reviewer"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isEmailVerified:{
        type: Boolean,
        default: false 
    },
    status: {
        type: String,
        enum: ['active','inactive'],
        required: true,
        default:'inactive'
      },
}, { timestamps: true });

module.exports = mongoose.model("user", user);