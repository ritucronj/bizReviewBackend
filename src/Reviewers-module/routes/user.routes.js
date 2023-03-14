const express = require("express");
const {
  registerUserWithEmail,
  getAllUsers,
  ssoRegisterAndLogin,
  updateUserProfile,
  filterUser,
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

module.exports = router;
