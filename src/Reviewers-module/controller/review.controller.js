const review = require('../models/review.models');
const { statusCodes } = require('../services/statusCodes');
const { createReviewValidation, updateReviewValidation } = require("../services/Validation-handler");
const { v4: uuidv4 } = require('uuid');


const createCompanyReview = async (req, res) => {
    try {
        let body = req.body;
        let Id = req.params.Id;
        const { error } = createReviewValidation(body);
        if (error) return res.status(statusCodes[400].value).send({ msg: error.details[0].message });
        body.uId = uuidv4();
        const checkReview = new Promise(async (resolve, reject) => {
            const findAndInsertReview = await review.findOneAndUpdate(
                { createdBy: Id },
                { $push: { reviews: body } },
                { new: true }
            );
            const error = findAndInsertReview === null ? true : false;
            if (error) reject(new Error("No Reviews Found by User"));
            resolve(findAndInsertReview);
        });
        checkReview
            .then((value) => {
                return res.status(statusCodes[200].value).send({ data: value });
            }).catch(async (err) => {
                console.error(err);
                const createReview = await review.create({ createdBy: Id, reviews: [body] });
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
                        createdBy: userId
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
}





module.exports = {
    createCompanyReview,
    readReviewById,
    readAllReviewsByUser,
    updateCompanyReview,
    deleteReviewById
}