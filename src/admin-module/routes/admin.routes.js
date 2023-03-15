const express = require("express");
const { adminRegister, adminLogin,updateAdmin } = require("../controller/admin.controller");
const router = express.Router();

router.post('/registerAdmin', adminRegister);
router.post('/loginAdmin', adminLogin);
router.put('updateAdmin/:id',updateAdmin)

module.exports = router;