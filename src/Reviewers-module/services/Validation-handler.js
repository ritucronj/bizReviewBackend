const joi = require('joi');

const userRegistrationValidation = (data) => {
    const schema = joi.object({
        email: joi.string().email(),
        code: joi.number().required()
    });
    return schema.validate(data);
}

module.exports = {
    userRegistrationValidation
}