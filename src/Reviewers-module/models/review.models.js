const mongoose = require("mongoose");

const reviews = new mongoose.Schema({
    uId: {
        type: String,
    },
    reviewedCompany: {
        type: String
    },
    title: {
        type: String
    },
    rating: {
        type: String,
    },
    description: {
        type: String,
    },
    dateOfExperience: {
        type: String,
    },
    status: {
        type: String,
        default: "Pending"
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


const userReviewSchema = new mongoose.Schema({
    createdBy: {
        type: String,
        required: true
    },
    reviews: {
        type: [reviews]
    }
}, { timestamps: true });

module.exports = mongoose.model("review", userReviewSchema);