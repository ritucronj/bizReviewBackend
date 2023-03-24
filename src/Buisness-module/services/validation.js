const joi = require("joi");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const createBusinessValidation = (data) => {
  const schema = joi.object({
    website: joi.string(),
    companyName: joi.string(),
    firstName: joi.string(),
    lastName: joi.string(),
    jobTitle: joi.string(),
    email: joi.string().email(),
    mobile: joi.string(),
    password: joi.string().alphanum(),
    location: joi.string(),
  });
  return schema.validate(data);
};

const updateBusinessValidation = (data) => {
  const schema = joi.object({
    name: joi.string(),
    firstName: joi.string(),
    lastName: joi.string(),
    country: joi.string(),
    language: joi.string(),
    address: joi.string(),
    zipCode: joi.string(),
    mobile: joi.string(),
    description: joi.string(),
    companyName: joi.string(),
    website: joi.string(),
    password: joi.string().alphanum(),
    locationName: joi.string(),
    locationId: joi.string(),
    street: joi.string(),
  });
  return schema.validate(data);
};

async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.log(error);
    throw new Error("Error hashing password");
  }
}

module.exports = {
  createBusinessValidation,
  updateBusinessValidation,
  hashPassword,
};
