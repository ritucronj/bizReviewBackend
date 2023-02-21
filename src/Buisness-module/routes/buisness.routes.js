const express = require("express");
const {
  createBusiness,
  loginBusiness,
} = require("../controller/buisness.controller");
const router = express.Router();

router.post("/business", createBusiness);

router.post("/business/login", loginBusiness);

module.exports = router;
