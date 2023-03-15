const mongoose = require("mongoose");

const admin = new mongoose.Schema({
    uId: {
        type: String
    },
    picture: {
        type: String
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ["super admin", "admin"],
        default: "admin"
    },
    isDeleted:{
   type:Boolean,
   default:false
    },
    status: {
        type: String,
        enum: ['active','inactive'],
        required: true,
        default:'active'
      },
}, { timestamps: true });

module.exports = mongoose.model("admin", admin);