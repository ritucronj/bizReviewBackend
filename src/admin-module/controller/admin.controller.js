const admin = require("../models/admin.models");
const { jwtGenerate, hashPassword, decrypt } = require("../services/admin.services");
const { adminRegistrationValidation, adminLoginValidation } = require("../services/validation");
const { statusCodes } = require("../utils/statusCodes");

const adminRegister = async (req, res) => {
    try {
        return new Promise(async (resolve, reject) => {
            const { error } = adminRegistrationValidation(req.body);
            if (error) reject(new Error(error.details[0].message));
            req.body.password = await hashPassword(req.body.password);
            const adminData=await admin.findOne({email:req.body.email})
             if(adminData && !error){
              return res.status(statusCodes[400].value).send({ msg: 'User already exists' });
             }
             resolve(await admin.create(req.body));
        }).then((data) => {
            return res.status(statusCodes[201].value).send({ data: data, token: jwtGenerate({ userId: data.uId }, "secret", { expiresIn: "24H" }) });
        }).catch((err) => {
            return res.status(statusCodes[400].value).send({ message: err.toString() });
        })
    } catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
};

const adminLogin = async (req, res) => {
    try {
        return new Promise(async (resolve, reject) => {
            const { error } = adminLoginValidation(req.body);
            if (error) reject(new Error(error.details[0].message));
            resolve(await admin.findOne({ email: req.body.email,status:'active',isDeleted:false }));
        })
            .then((data) => {
                const error = data === null ? true : false;
                if (error) throw new Error("No admin Found , please sign up !");
                return new Promise(async (resolve, reject) => {
                    const isValidPassword = await decrypt(req.body.password, data.password);
                    if (!isValidPassword) reject(new Error("Invalid Password"));
                    resolve([data, jwtGenerate({ userId: data.uId }, "secret", { expiresIn: "24H" })]);
                }).then((result) => {
                    return res.status(statusCodes[200].value).send({ data: result[0], token: result[1] });
                }).catch((err) => {
                    return res.status(statusCodes[400].value).send({ msg: err.message });
                })
            })
            .catch((err) => {
                return res.status(statusCodes[400].value).send({ msg: err.message });
            })
    } catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
}

const updateAdmin= (req, res) => {
  console.log('insidee')
    const id = req.params.id;
    const adminData = req.body;
  
    // Find admin by ID and update their details
    admin.findByIdAndUpdate(id, adminData, { new: true })
      .then(updatedAdmin => {
        res.status(200).send(updatedAdmin);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({ error: 'Could not update admin' });
      });
  }

  const searchAdmin= async (req, res) => {
    const { search, page, limit } = req.query; // the search query parameter and pagination parameters
  
    try {
      const admins = await admin.find({
        $and: [
            { isDeleted: false },
          {
            $or: [
              { email: { $regex: new RegExp(search, 'i') } }, // case-insensitive search by companyName
              { name: { $regex: new RegExp(search, 'i') } } // case-insensitive search by website
            ],
          },
        ],
      })
        .skip((page - 1) * limit) // calculate the number of documents to skip
        .limit(parseInt(limit)); // convert the limit parameter to a number and use it as the limit
  
      res.status(200).json(admins);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  }

  const deleteAdminPermanently = async (req, res) => {
    try {
      const Admin = await admin.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
      res.status(200).json(Admin);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };
  
  const deleteMultipleAdminPermanently = async (req, res) => {
    const { ids } = req.body;
    try {
      const result = await admin.updateMany(
        { _id: { $in: ids } },
        { isDeleted: true }
      );
      res.status(200).json({result:result,message:`${result.modifiedCount} updated successfully`});
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };

module.exports = {
    adminRegister,
    adminLogin,
    updateAdmin,
    searchAdmin,
    deleteAdminPermanently,
    deleteMultipleAdminPermanently
}