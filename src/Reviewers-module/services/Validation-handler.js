const joi = require("joi");

const userRegistrationValidation = (data) => {
  const schema = joi.object({
    email: joi.string().email(),
    code: joi.number().required(),
  });
  return schema.validate(data);
};

const ssoRegistrationValidation = (data) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    name: joi.string(),
    picture: joi.string().uri(),
    email_verified: joi.boolean().required(),
  });
  return schema.validate(data);
};

const createReviewValidation = (data) => {
  const schema = joi.object({
    reviewedBuisnessId: joi.string().required(),
    title: joi.string().required(),
    rating: joi.number().required(),
    description: joi.string(),
    dateOfExperience: joi.string(),
  });
  return schema.validate(data);
};

const updateReviewValidation = (data) => {
  const schema = joi.object({
    title: joi.string(),
    rating: joi.string().min(1),
    description: joi.string(),
    dateOfExperience: joi.string(),
  });
  return schema.validate(data);
};

module.exports = {
  userRegistrationValidation,
  createReviewValidation,
  updateReviewValidation,
  ssoRegistrationValidation,
};
