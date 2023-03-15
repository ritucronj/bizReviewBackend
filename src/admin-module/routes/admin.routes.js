const express = require("express");
const { adminRegister, adminLogin,updateAdmin,searchAdmin,deleteAdminPermanently,deleteMultipleAdminPermanently } = require("../controller/admin.controller");
const router = express.Router();

router.post('/registerAdmin', adminRegister);
router.post('/loginAdmin', adminLogin);
router.put('updateAdmin/:id',updateAdmin);
router.get('/searchAdmin',searchAdmin);
router.put("/deleteAdminPermanently/:id", deleteAdminPermanently);
router.put("/deleteMultipleAdminPermanently", deleteMultipleAdminPermanently);

module.exports = router;