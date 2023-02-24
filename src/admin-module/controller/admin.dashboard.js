const reviewer = require("../../Reviewers-module/models/user.models");
const buisness = require("../../Buisness-module/models/business.model");
const { statusCodes } = require("../utils/statusCodes");

const dashboard = async (req, res) => {
    try {
        const reviewerCount = new Promise(async (resolve, reject) => {
            resolve(await reviewer.find().count());
        });
        const buisnessCount = new Promise(async (resolve, reject) => {
            resolve(await buisness.find().count());
        });
        Promise.allSettled([reviewerCount, buisnessCount])
            .then((val) => {
                return res.status(statusCodes[200].value).send(
                    {
                        reviewerCount: val[0].value,
                        buisnessCount: val[1].value
                    }
                );
            }).catch(err => {
                return res.status(statusCodes[400].value).send({ msg: err.message });
            })
    } catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { name, companyName, email, fromDate, toDate, page = 1, limit = 10 } = req.query;
        const reviewerData = new Promise(async (resolve, reject) => {
            const queryFilter = {};
            if (name) {
                queryFilter.name = { $regex: name, $options: "i" };
            }
            if (email) {
                queryFilter.email = { $regex: email, $options: "i" };
            }
            if (fromDate && toDate) {
                queryFilter.createdAt = { $gte: new Date(fromDate), $lt: new Date(toDate) };
            }
            queryFilter.isDeleted = false;
            resolve(await reviewer.find(queryFilter))
            // .sort({ name: 1 }).limit(limit * 1).skip((page - 1) * limit).select({ _id: 0, name: 1, email: 1, createdAt: 1, userType: 1, isDeleted: 1 }));
        });
        reviewerData.then((data) => {
            console.log(data);
        })
        const buisnessData = new Promise(async (resolve, reject) => {
            const queryFilter = {};
            if (companyName) {
                queryFilter.companyName = { $regex: companyName, $options: "i" };
            }
            if (email) {
                queryFilter.email = { $regex: email, $options: "i" };
            }
            if (fromDate && toDate) {
                queryFilter.createdAt = { $gte: new Date(fromDate), $lt: new Date(toDate) };
            }
            queryFilter.isDeleted = false;
            resolve(await buisness.find(queryFilter))
            // .sort({ companyName: 1 }).limit(limit * 1).skip((page - 1) * limit).select({ _id: 0, companyName: 1, email: 1, createdAt: 1, userType: 1, isDeleted: 1 }));
        });
        buisnessData.then((data) => {
            console.log(data);
        })
        // Promise.allSettled([reviewerData, buisnessData])
        //     .then((data) => {
        //         console.log(data);
        //         return res.status(statusCodes[200].value).send({ data: data[0].value.concat(data[1].value) });
        //     })
    } catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
}

module.exports = {
    dashboard,
    getAllUsers
}