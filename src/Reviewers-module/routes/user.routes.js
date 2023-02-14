const express = require("express");
const { registerUserWithEmail } = require("../controller/user.controller");
const router = express.Router();

router.get("/hello", (req, res) => {
    res.send({ data: "hello" })
});

router.post('/register', registerUserWithEmail);

module.exports = router;