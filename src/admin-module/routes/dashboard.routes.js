const express = require("express");
const { dashboard, getAllUsers } = require("../controller/admin.dashboard");
const router = express.Router();

router.get('/dashboard', dashboard);
router.get('/dashboard/getAllUser', getAllUsers);

module.exports = router;

