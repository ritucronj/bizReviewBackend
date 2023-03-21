const user = require("../models/user.models");
const review = require("../models/review.models");
const Business = require("../../Buisness-module/models/business.model");
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
      const findUser = await user.findOne({ email: data.email, isDeleted:false });
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
        // if (data.code != 0000) {
        //   throw new Error("invalid code");
        // }
        const userData = await user.create(data);
        let payload = { userId: userData.uId };
        // const token = jwtGenerate(payload, "secret", {
        //   expiresIn: "24H",
        // });
        return res
          .status(statusCodes[201].value)
          .send({ data: userData });
      })
      .catch(async (err) => {
        console.error(err);
        return res
          .status(statusCodes[200].value)
          .send({ data: err[0]});
      });
  } catch (error) {
    return res
      .status(statusCodes[500].value)
      .send({ status: statusCodes[500].message, msg: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const data = await user.find({ isDeleted: false });
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
          if (registeredUser && !findUser.isDeleted ) {
            reject([
              findUser,
              jwtGenerate({ userId: findUser.uId }, "secret", {
                expiresIn: "24H",
              }),
            ]);
          } else if(!registeredUser  ){
            
              resolve(
                await user.create({
                  name: name,
                  email: email,
                  profilePicture: picture,
                  language: locale,
                  isEmailVerified:true,
                  status:'active'
                })
              );
            }else{
              res.status(400).send({message:'user deleted'})
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
        if (registeredUser && !findUser.isDeleted) {
          reject([
            findUser,
            jwtGenerate({ userId: findUser.uId }, "secret", {
              expiresIn: "24H",
            }),
          ]);
        } else if(!registeredUser &&!findUser.isDeleted) {
            resolve(
              await user.create({
                name: name,
                email: email,
                profilePicture: picture.data.url,
                isEmailVerified:true,
                  status:'active'
              })
            );
         
        }  else{
          res.status(400).send({message:'user deleted'})
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
    const updatePromise = new Promise(async (resolve, reject) => {
      const { error } = userUpdateValidataion(req.body);
      if (error) reject(new Error(error.details[0].message));
      const findUser = await user.findOneAndUpdate(req.params.id, req.body, {
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

const filterUser = async (req, res) => {
  try {
    const { fromdate, todate, searchtext, usertype } = req.query;
    let results = [];
    if (fromdate && todate && searchtext) {
      if (searchtext.includes("@")) {
        if (usertype === "reviewer") {
          results = await user.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else if (usertype === "business") {
          results = await Business.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else {
          const reviewerResults = await user.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          const businessResults = await Business.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          results = reviewerResults.concat(businessResults);
        }
      } else {
        if (usertype === "reviewer") {
          results = await user.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else if (usertype === "business") {
          results = await Business.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else {
          const reviewerResults = await user.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          const businessResults = await Business.find({
            $and: [
              {
                createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) },
              },
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          results = reviewerResults.concat(businessResults);
        }
      }
      return res.status(200).send(results);
    }
    if (!(fromdate && todate) && searchtext) {
      if (searchtext.includes("@")) {
        if (usertype === "reviewer") {
          results = await user.find({
            $and: [
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else if (usertype === "business") {
          results = await Business.find({
            $and: [
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else {
          const reviewerResults = await user.find({
            $and: [
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          const businessResults = await Business.find({
            $and: [
              { email: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          results = reviewerResults.concat(businessResults);
        }
      } else {
        if (usertype === "reviewer") {
          results = await user.find({
            $and: [
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else if (usertype === "business") {
          results = await Business.find({
            $and: [
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
        } else {
          const reviewerResults = await user.find({
            $and: [
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          const businessResults = await Business.find({
            $and: [
              { name: { $regex: searchtext, $options: "i" } },
              { isDeleted: false },
            ],
          });
          results = reviewerResults.concat(businessResults);
        }
      }
      return res.status(200).send(results);
    }
    if (fromdate && todate && !searchtext) {
      if (usertype === "reviewer") {
        results = await user.find({
          $and: [
            { createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) } },
            { isDeleted: false },
          ],
        });
      } else if (usertype === "business") {
        results = await Business.find({
          $and: [
            { createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) } },
            { isDeleted: false },
          ],
        });
      } else {
        const reviewerResults = await user.find({
          $and: [
            { createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) } },
            { isDeleted: false },
          ],
        });
        const businessResults = await Business.find({
          $and: [
            { createdAt: { $gte: new Date(fromdate), $lte: new Date(todate) } },
            { isDeleted: false },
          ],
        });
        results = reviewerResults.concat(businessResults);
      }
      return res.status(200).send(results);
    }
    if (!(fromdate && todate && searchtext)) {
      if (usertype === "reviewer") {
        results = await user.find({ isDeleted: false });
      } else if (usertype === "business") {
        results = await Business.find({ isDeleted: false });
      } else {
        const reviewerResults = await user.find({ isDeleted: false });
        const businessResults = await Business.find({ isDeleted: false });
        results = reviewerResults.concat(businessResults);
      }
      return res.status(200).send(results);
    }
  } catch (error) {
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};

const deleteSingleUser = async (req, res) => {
  try {
    let userId = req.params.id;
    let userType = req.body.userType;
    let result = null;
    if (userType && userType.toLowerCase() === "reviewer") {
      const findUser = await user.findOneAndUpdate(
        { _id: userId },
        { isDeleted: true },
        {
          new: true,
        }
      );
      result = findUser;
    }
    if (userType && userType.toLowerCase() === "business") {
      const findUser = await Business.findOneAndUpdate(
        { _id: userId },
        { isDeleted: true },
        {
          new: true,
        }
      );
      result = findUser;
    }
    return res.status(200).send(result);
  } catch (error) {
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};
const deleteMultipleUser = async (req, res) => {
  try {
    let users = req.body.usersList;
    let result = null;
    let businessIds = [];
    let reviewerIds = [];
    if (users && users.length > 0) {
      users.map(async (item) => {
        // let userId = item.id;
        if (item?.userType && item?.userType.toLowerCase() === "reviewer") {
          reviewerIds.push(item.id);
        }
        if (item?.userType && item?.userType.toLowerCase() === "buisness") {
          businessIds.push(item.id);
        }
      });
    }
    if (businessIds.length) {
      const result = await Business.updateMany(
        { _id: { $in: businessIds } },
        { isDeleted: true }
      );
      return res.status(200).json(result);
    }
    if (reviewerIds.length) {
      const result = await user.updateMany(
        { _id: { $in: reviewerIds } },
        { isDeleted: true }
      );
      return res.status(200).json(result);
    }

    return res.status(200).send({ msg: "Users Deleted Successfully" });
  } catch (error) {
    return res.status(statusCodes[500].value).send({ msg: error.message });
  }
};

const deleteReviewerPermanently = async (req, res) => {
  try {
    const userData = await user.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
   if(userData){
    res.status(200).json(userData);
   }else{
    res.status(400).send({message:'Incorrect user id'});
   }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const deleteMultipleReviewerPermanently = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await user.updateMany(
      { _id: { $in: ids } },
      { isDeleted: true }
    );
    res.status(200).json({result:result,message:`${result.modifiedCount} updated successfully`});
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


const deleteReviewerTemporarily = async (req, res) => {
  try {
    const userData = await user.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

module.exports = {
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
};
