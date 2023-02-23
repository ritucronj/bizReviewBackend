const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const jwtGenerate = function (payload, secret, expirationTime) {
    return jwt.sign(payload, secret, expirationTime);
}

const SALT_ROUNDS = 10;

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

function decrypt(password,encryptPassword) {
    return bcrypt.compare(password, encryptPassword);
}

module.exports = {
    jwtGenerate,
    hashPassword,
    decrypt
}