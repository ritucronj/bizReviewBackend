const user = require("../models/user.models");
const review = require("../models/review.models");
const {
  userRegistrationValidation,
  ssoRegistrationValidation,
  userUpdateValidataion,
} = require("../services/Validation-handler");
const { statusCodes } = require("../services/statusCodes");
const { v4: uuidv4 } = require("uuid");
const { jwtGenerate } = require("../services/user.services");

const registerUserWithEmail = async (req, res) => {
  try {
    let data = req.body;
    const { error } = userRegistrationValidation(data);
    if (error)
      return res
        .status(statusCodes[400].value)
        .send({ msg: error.details[0].message });
    data.uId = uuidv4();
    const checkUnique = new Promise(async (resolve, reject) => {
      const findUser = await user.findOne({ email: data.email });
      const error = findUser !== null ? true : false;
      if (error) {
        reject([
          findUser,
          jwtGenerate({ userId: findUser.uId }, "secret", { expiresIn: "24H" }),
        ]);
      } else {
        resolve();
      }
    });
    checkUnique
      .then(async () => {
        if (data.code != 0000) {
          throw new Error("invalid code");
        }
        const userData = await user.create(data);
        let payload = { userId: userData.uId };
        const token = jwtGenerate(payload, "secret", {
          expiresIn: "24H",
        });
        return res
          .status(statusCodes[201].value)
          .send({ data: userData, token: token });
      })
      .catch(async (err) => {
        console.error(err);
        return res
          .status(statusCodes[200].value)
          .send({ data: err[0], token: err[1] });
      });
  } catch (error) {
    return res
      .status(statusCodes[500].value)
      .send({ status: statusCodes[500].message, msg: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const data = await user.find();
    return res.send(data);
  } catch (error) {
    console.log(error);
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};

const ssoRegisterAndLogin = async (req, res) => {
  try {
    let identify = req.query.key;
    if (identify.toLowerCase() === "google") {
      const { error } = ssoRegistrationValidation(req.body);
      if (error)
        return res
          .status(statusCodes[400].value)
          .send({ msg: error.details[0].message });
      let { name, picture, email, email_verified, locale } = req.body;
      if (email_verified) {
        const saveUserData = new Promise(async (resolve, reject) => {
          const findUser = await user.findOne({ email: email });
          const registeredUser = findUser !== null ? true : false;
          if (registeredUser) {
            reject([
              findUser,
              jwtGenerate({ userId: findUser.uId }, "secret", {
                expiresIn: "24H",
              }),
            ]);
          } else {
            resolve(
              await user.create({
                name: name,
                email: email,
                profilePicture: picture,
                language: locale,
              })
            );
          }
        });
        saveUserData
          .then((data) => {
            let payload = { userId: data.uId };
            const token = jwtGenerate(payload, "secret", {
              expiresIn: "24H",
            });
            return res
              .status(statusCodes[201].value)
              .send({ data: data, token: token });
          })
          .catch((dataArr) => {
            return res
              .status(statusCodes[200].value)
              .send({ data: dataArr[0], token: dataArr[1] });
          });
      } else {
        return res
          .status(statusCodes[400].value)
          .send({ msg: "invalid request" });
      }
    } else if (identify.toLowerCase() === "facebook") {
      let { name, picture, email } = req.body;
      const saveUserData = new Promise(async (resolve, reject) => {
        const findUser = await user.findOne({ email: email });
        const registeredUser = findUser !== null ? true : false;
        if (registeredUser) {
          reject([
            findUser,
            jwtGenerate({ userId: findUser.uId }, "secret", {
              expiresIn: "24H",
            }),
          ]);
        } else {
          resolve(
            await user.create({
              name: name,
              email: email,
              profilePicture: picture.data.url,
            })
          );
        }
      });
      saveUserData
        .then((data) => {
          let payload = { userId: data.uId };
          const token = jwtGenerate(payload, "secret", {
            expiresIn: "24H",
          });
          return res
            .status(statusCodes[201].value)
            .send({ data: data, token: token });
        })
        .catch((dataArr) => {
          return res
            .status(statusCodes[200].value)
            .send({ data: dataArr[0], token: dataArr[1] });
        });
    } else {
      return res
        .status(statusCodes[400].value)
        .send({ msg: "Invalid identification param" });
    }
  } catch (error) {
    console.error(error);
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    let files = req.files;
    let userId = req.params.Id;
    const updatePromise = new Promise(async (resolve, reject) => {
      const { error } = userUpdateValidataion(req.body);
      if (error) reject(new Error(error.details[0].message));
      const findUser = await user.findOneAndUpdate({ uId: userId }, req.body, {
        new: true,
      });
      if (findUser === null) reject(new Error("No User Found"));
      else resolve(findUser);
    });
    updatePromise
      .then((data) => {
        return res.status(statusCodes[200].value).send({ data: data });
      })
      .catch((err) => {
        return res.status(statusCodes[400].value).send({ msg: err.message });
      });
  } catch (error) {
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};

const deleteUserProfile = async (req, res) => {
  try {
    let userId = req.params.Id;
    const deletePromise = new Promise(async (resolve, reject) => {
      const findUser = await user.findOneAndUpdate(
        { uId: userId },
        { isDeleted: true },
        { new: true }
      );
      if (findUser === null) reject(new Error("No User Found"));
      else resolve();
    });
    deletePromise.then(async () => {
      await review.findOneAndUpdate(
        { createdBy: userId },
        { isUserActive: false },
        { new: true }
      );
      return res
        .status(statusCodes[200].value)
        .send({ msg: "Successfully Deleted" });
    });
  } catch (error) {
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};

module.exports = {
  registerUserWithEmail,
  getAllUsers,
  ssoRegisterAndLogin,
  updateUserProfile,
};
