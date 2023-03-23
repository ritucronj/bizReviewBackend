const express = require("express");
const {
  registerUserWithEmail,
  getAllUsers,
  ssoRegisterAndLogin,
  updateUserProfile,
  filterUser,
  deleteSingleUser,
  deleteMultipleUser,
  deleteReviewerPermanently,
  deleteMultipleReviewerPermanently,
  deleteReviewerTemporarily

} = require("../controller/user.controller");
const router = express.Router();

// const authenticate= require('../../utils/auth.middleware');

router.post("/register", registerUserWithEmail);
router.post("/registerSSO", ssoRegisterAndLogin);
router.get("/getAll", getAllUsers);
router.put("/updateProfile/:Id", updateUserProfile);
router.get("/getUser", filterUser);
router.put("/deleteuser/:id", deleteSingleUser);
router.put("/deleteusers", deleteMultipleUser);
router.put("/deleteReviewerPermanently/:id", deleteReviewerPermanently);
router.put("/deleteMultipleReviewerPermanently", deleteMultipleReviewerPermanently);
router.put("/deleteReviewerTemporarily/:id", deleteReviewerTemporarily);

module.exports = router;
