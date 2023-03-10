const review = require('../models/review.models');
const user = require("../models/user.models");
const buisnessReview = require('../../Buisness-module/models/buisness.review.model');
const buisness = require("../../Buisness-module/models/business.model");
const { statusCodes } = require('../services/statusCodes');
const { createReviewValidation, updateReviewValidation } = require("../services/Validation-handler");
const { v4: uuidv4 } = require('uuid');


const createCompanyReview = async (req, res) => {
    try {
        let body = req.body;
        let userId = req.params.Id;
        let { reviewedBuisnessId } = req.body;
        const { error } = createReviewValidation(body);
        if (error) return res.status(statusCodes[400].value).send({ msg: error.details[0].message });
        body.uId = uuidv4();
        const checkReview = new Promise(async (resolve, reject) => {
            const findAndInsertReview = await review.findOneAndUpdate(
                { createdBy: userId },
                { $push: { reviews: body } },
                { new: true }
            );
            const error = findAndInsertReview === null ? true : false;
            if (error) reject(new Error("No Reviews Found by User"));
            resolve(findAndInsertReview);
        });
        checkReview
            .then((value) => {
                const insertForBuisness = new Promise(async (resolve, reject) => {
                    body.reviewedBy = userId;
                    body.uId = uuidv4();
                    const findBuinessAndInsert = await buisnessReview.findOneAndUpdate(
                        { buisnessId: reviewedBuisnessId },
                        { $push: { reviews: body } },
                        { new: true }
                    );
                    const error = findBuinessAndInsert === null ? true : false;
                    if (error) reject(new Error(`no Buisness found with Id ${reviewedBuisnessId}`));
                    resolve(findBuinessAndInsert);
                });
                insertForBuisness
                    .then(async (val) => {
                        await buisnessReview.updateOne(
                            { buisnessId: reviewedBuisnessId },
                            [
                                { $set: { totalReviews: { $size: "$reviews" } } },
                                { $set: { averageRating: { $trunc: [{ $avg: "$reviews.rating" }] } } }
                            ]
                        );
                    })
                    .catch((err) => {
                        return res.status(statusCodes[400].value).send({ msg: err.message });
                    })
                return res.status(statusCodes[200].value).send({ data: value });
            }).catch(async (err) => {
                console.error(err);
                const createReview = await review.create({ createdBy: userId, reviews: [body] });
                return res.status(statusCodes[201].value).send({ data: createReview });
            });
    } catch (error) {
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
}

const readReviewById = async (req, res) => {
    try {
        let reviewId = req.params.review;
        let userId = req.params.user;
        const checkReview = new Promise(async (resolve, reject) => {
            const findReview = await review.findOne(
                {
                    $and:
                        [
                            { createdBy: userId },
                            { "reviews.uId": reviewId }
                        ]
                },
                {
                    "reviews.$": 1
                }
            );
            if (findReview.reviews[0].isDeleted === true) reject(new Error("Something went wrong"));
            const error = findReview === null ? true : false;
            if (error) reject(new Error("No Review Found"));
            resolve(findReview);
        });
        checkReview
            .then((result) => {
                return res.status(statusCodes[200].value).send({ data: result });
            })
            .catch((err) => {
                return res.status(statusCodes[400].value).send({ msg: err.message });
            });
    } catch (error) {
        console.log(error);
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
}

const readAllReviewsByUser = async (req, res) => {
    try {
        let userId = req.params.user;
        const checkReview = new Promise(async (resolve, reject) => {
            const findReview = await review.aggregate([
                {
                    "$match": {
                        $and: [{ createdBy: userId }, { isUserActive: true }]
                    }
                },
                {
                    "$project": {
                        "reviews": {
                            "$filter": {
                                input: "$reviews",
                                as: "review",
                                cond: { $eq: ["$$review.isDeleted", false] }
                            }
                        }
                    }
                }
            ])
            console.log(findReview);
            const error = findReview === null ? true : false;
            if (error) reject(new Error("No Review Found"));
            resolve(findReview);
        });
        checkReview
            .then((result) => {
                return res.status(statusCodes[200].value).send({ data: result });
            })
            .catch((err) => {
                return res.status(statusCodes[400].value).send({ msg: err.message });
            });
    } catch (error) {
        console.log(error);
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
};

const recentReviews = async (req, res) => {
    try {
        let userId = req.params.Id;
        const checkRecentReviews = new Promise(async (resolve, reject) => {
            const getRecentReviews = await review.aggregate([
                {
                    "$match": {
                        $and: [{ createdBy: userId }, { isUserActive: true }]
                    }
                },
                {
                    "$project": {
                        "reviews": {
                            "$filter": {
                                input: "$reviews",
                                as: "review",
                                cond: { $eq: ["$$review.isDeleted", false] }
                            }
                        }
                    }
                },
                {
                    $unwind: "$reviews"
                },
                {
                    "$sort": {
                        "reviews.createdAt": -1
                    }
                },
                // {
                //     "$limit": 2
                // }
            ]);
            const error = getRecentReviews.length == 0 ? true : false;
            if (error) reject(new Error("No Documents Found"));
            resolve(getRecentReviews);
        })
        checkRecentReviews
            .then((result) => {
                return res.status(statusCodes[200].value).send({ data: result });
            })
            .catch((err) => {
                return res.status(statusCodes[400].value).send({ msg: err.message });
            })
    } catch (error) {
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
}

const updateCompanyReview = async (req, res) => {
    try {
        let reviewId = req.params.review;
        let userId = req.params.user;
        const { error } = updateReviewValidation(req.body);
        if (error) return res.status(statusCodes[400].value).send({ msg: error.details[0].message });
        const checkReview = new Promise(async (resolve, reject) => {
            const findReviewAndUpdate = await review.updateOne(
                {
                    createdBy: userId,
                    "reviews.uId": reviewId
                },
                {
                    $set:
                    {
                        'reviews.$.title': req.body.title,
                        'reviews.$.description': req.body.description,
                        'reviews.$.rating': req.body.rating,
                        'reviews.$.dateOfExperience': req.body.dateOfExperience,
                    }
                },
                {
                    new: true
                }
            );
            const error = findReviewAndUpdate.matchedCount == 0 ? true : false;
            if (error) reject(new Error("No Reviews Found"));
            resolve(findReviewAndUpdate);
        });
        checkReview
            .then((data) => {
                return res.status(statusCodes[200].value).send({ data: data });
            })
            .catch((err) => {
                console.error(err);
                return res.status(statusCodes[400].value).send({ msg: err.message });
            });
    } catch (error) {
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
}

const deleteReviewById = async (req, res) => {
    try {
        let reviewId = req.params.review;
        let userId = req.params.user;
        const { error } = updateReviewValidation(req.body);
        if (error) return res.status(statusCodes[400].value).send({ msg: error.details[0].message });
        const checkReview = new Promise(async (resolve, reject) => {
            const findReviewAndUpdate = await review.findOneAndUpdate(
                {
                    $and:
                        [
                            { createdBy: userId },
                            { "reviews.uId": reviewId },
                            { "reviews.isDeleted": false }
                        ]
                },
                {
                    $set:
                    {
                        'reviews.$.isDeleted': true,
                    }
                },
                {
                    new: true
                }
            );
            const error = findReviewAndUpdate === null ? true : false;
            if (error) reject(new Error("No Reviews Found"));
            resolve("Review Successfully Deleted");
        });
        checkReview
            .then((data) => {
                return res.status(statusCodes[200].value).send({ data: data });
            })
            .catch((err) => {
                console.error(err);
                return res.status(statusCodes[400].value).send({ msg: err.message });
            });
    } catch (error) {
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
};

const recentReviewsPublic = async (req, res) => {
    try {
        const findUsers = await user.find();
        const resultArr = [];
        for (let i = 0; i < findUsers.length; i++) {
            const reviews = await review.aggregate([
                {
                    "$match": {
                        createdBy: findUsers[i].uId
                    }
                },
                {
                    "$project": {
                        "reviews": {
                            "$filter": {
                                input: "$reviews",
                                as: "review",
                                cond: { $eq: ["$$review.isDeleted", false] }
                            }
                        }
                    }
                },

                {
                    $unwind: "$reviews"
                },
                {
                    "$sort": {
                        "reviews.createdAt": -1
                    }
                },
                {
                    "$addFields": {
                        userDetails: findUsers[i]
                    }
                },
            ]);
            // console.log(reviews);
            if (reviews.length === 0) {
                continue;
            } else {
                resultArr.push(reviews[0]);
            }
        }
        return res.status(statusCodes[200].value).send({ data: resultArr });
    } catch (error) {
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
};



module.exports = {
    createCompanyReview,
    readReviewById,
    readAllReviewsByUser,
    recentReviews,
    updateCompanyReview,
    deleteReviewById,
    recentReviewsPublic
}