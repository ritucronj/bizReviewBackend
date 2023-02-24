const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticate(req, res, next) {
  const token = req.headers["x-access-token"] || req.headers.authorization;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication failed. Token not provided." });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Authentication failed. Invalid token." });
    }
    req.user = decoded;
    next();
  });
}

module.exports = authenticate;
