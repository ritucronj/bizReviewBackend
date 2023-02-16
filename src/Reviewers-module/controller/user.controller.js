const user = require('../models/user.models');
const review = require("../models/review.models");
const { userRegistrationValidation } = require("../services/Validation-handler");
const { statusCodes } = require("../services/statusCodes");
const { v4: uuidv4 } = require('uuid');


const registerUserWithEmail = async (req, res) => {
    try {
        let data = req.body;
        const { error } = userRegistrationValidation(data);
        if (error) return res.status(statusCodes[400].value).send({ msg: error.details[0].message });
        data.uId = uuidv4();
        const checkUnique = new Promise(async (resolve, reject) => {
            const findUser = await user.findOne({ email: data.email });
            const error = findUser !== null ? true : false;
            if (error) {
                reject(new Error("User Exist with this email"));
            } else {
                resolve();
            }
        });
        checkUnique
            .then(async () => {
                if (data.code != 0000) {
                    throw new Error('invalid code');
                }
                const userData = await user.create(data);
                return res.status(statusCodes[201].value).send({ data: userData });
            })
            .catch(async (err) => {
                console.error(err);
                return res.status(statusCodes[400].value).send({ msg: err.message });
            });
    } catch (error) {
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const data = await user.find();
        return res.send(data);
    } catch (error) {
        console.log(error);
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
}

module.exports = {
    registerUserWithEmail,
    getAllUsers
}