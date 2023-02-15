const express = require("express");
const { registerUserWithEmail, getAllUsers } = require("../controller/user.controller");
const router = express.Router();

router.get("/hello", (req, res) => {
    res.send({ data: "hello" })
});

router.post('/register', registerUserWithEmail);
router.get("/getAll", getAllUsers);

module.exports = router;