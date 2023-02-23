const express = require("express");
const { adminRegister, adminLogin } = require("../controller/admin.controller");
const router = express.Router();

router.post('/registerAdmin', adminRegister);
router.post('/loginAdmin', adminLogin);

module.exports = router;