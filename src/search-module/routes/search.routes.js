const express = require('express');
const { searchBuisness } = require('../contoller/search');
const router = express.Router();

router.get('/buisness', searchBuisness);



module.exports = router;