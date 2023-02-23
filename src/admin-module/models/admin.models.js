const mongoose = require("mongoose");

const admin = new mongoose.Schema({
    uId: {
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
    }
}, { timestamps: true });

module.exports = mongoose.model("admin", admin);