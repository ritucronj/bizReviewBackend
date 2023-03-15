const express = require("express");
const {
  registerUserWithEmail,
  getAllUsers,
  ssoRegisterAndLogin,
  updateUserProfile,
  filterUser,
  deleteSingleUser,
  deleteMultipleUser,
} = require("../controller/user.controller");
const router = express.Router();

router.get("/hello", (req, res) => {
  res.send({ data: "hello" });
});

router.post("/register", registerUserWithEmail);
router.post("/registerSSO", ssoRegisterAndLogin);
router.get("/getAll", getAllUsers);
router.put("/updateProfile/:Id", updateUserProfile);
router.get("/getUser", filterUser);
router.put("/deleteuser/:id", deleteSingleUser);
router.put("/deleteusers", deleteMultipleUser);

module.exports = router;
