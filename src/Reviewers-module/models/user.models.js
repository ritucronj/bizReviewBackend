const mongoose = require('mongoose');
const { randomUUID } = require("crypto");

const user = new mongoose.Schema({
    uId: {
        type: String,
        default: randomUUID()
    },
    email: {
        type: String,
        // required: true
    },
    name: {
        type: String,
        // required: true
    },
    country: {
        type: String,
        // required: true
    },
    language: {
        type: String,
        // required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("user", user);