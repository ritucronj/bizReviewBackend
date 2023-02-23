const joi = require("joi");

const adminRegistrationValidation = (data) => {
    const schema = joi.object({
        name: joi.string().required(),
        email: joi.string().required().email(),
        password: joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "password").required(),
        confirmPassword: joi.string().required().valid(joi.ref('password')),
        role: joi.string(),
        picture: joi.string()
    });
    return schema.validate(data);
};

const adminLoginValidation = (data) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    });
    return schema.validate(data);
}

module.exports = {
    adminRegistrationValidation,
    adminLoginValidation
}