const express = require("express");
const router = express.Router();

router.get("/hello", (req, res) => {
    res.send({ data: "hello" })
});

module.exports = router;