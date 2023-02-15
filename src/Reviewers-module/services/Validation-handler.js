const joi = require('joi');

const userRegistrationValidation = (data) => {
    const schema = joi.object({
        email: joi.string().email(),
        code: joi.number().required()
    });
    return schema.validate(data);
}

const createReviewValidation = (data) => {
    const schema = joi.object({
        reviewedCompany:joi.string(),
        title: joi.string().required(),
        rating: joi.string().min(1).required(),
        description: joi.string().required(),
        dateOfExperience: joi.string().required(),
    });
    return schema.validate(data);
}

const updateReviewValidation = (data) => {
    const schema = joi.object({
        title: joi.string(),
        rating: joi.string().min(1),
        description: joi.string(),
        dateOfExperience: joi.string(),
    });
    return schema.validate(data);
}

module.exports = {
    userRegistrationValidation,
    createReviewValidation,
    updateReviewValidation
}