const jwt = require("jsonwebtoken");

const jwtGenerate = function (payload, secret, expirationTime) {
    return jwt.sign(payload, secret, expirationTime);
}


module.exports = {
    jwtGenerate
}