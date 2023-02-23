const admin = require("../models/admin.models");
const { jwtGenerate, hashPassword, decrypt } = require("../services/admin.services");
const { adminRegistrationValidation, adminLoginValidation } = require("../services/validation");
const { statusCodes } = require("../utils/statusCodes");

const adminRegister = async (req, res) => {
    try {
        return new Promise(async (resolve, reject) => {
            const { error } = adminRegistrationValidation(req.body);
            if (error) reject(new Error(error.details[0].message));
            req.body.password = await hashPassword(req.body.password);
            resolve(await admin.create(req.body));
        }).then((data) => {
            return res.status(statusCodes[201].value).send({ data: data, token: jwtGenerate({ userId: data.uId }, "secret", { expiresIn: "24H" }) });
        }).catch((err) => {
            return res.status(statusCodes[400].value).send({ msg: err });
        })
    } catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
};

const adminLogin = async (req, res) => {
    try {
        return new Promise(async (resolve, reject) => {
            const { error } = adminLoginValidation(req.body);
            if (error) reject(new Error(error.details[0].message));
            resolve(await admin.findOne({ email: req.body.email }));
        })
            .then((data) => {
                const error = data === null ? true : false;
                if (error) throw new Error("No admin Found , please sign up !");
                return new Promise(async (resolve, reject) => {
                    const isValidPassword = await decrypt(req.body.password, data.password);
                    if (!isValidPassword) reject(new Error("Invalid Password"));
                    resolve([data, jwtGenerate({ userId: data.uId }, "secret", { expiresIn: "24H" })]);
                }).then((result) => {
                    return res.status(statusCodes[200].value).send({ data: result[0], token: result[1] });
                }).catch((err) => {
                    return res.status(statusCodes[400].value).send({ msg: err.message });
                })
            })
            .catch((err) => {
                return res.status(statusCodes[400].value).send({ msg: err.message });
            })
    } catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
}

module.exports = {
    adminRegister,
    adminLogin
}