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
        const { username, fromDate, toDate, userType, page = 1, limit = 10 } = req.query;
        const queryFilter = {};
        if (fromDate && toDate) {
            queryFilter.createdAt = { $gte: new Date(fromDate), $lt: new Date(toDate) };
        }
        if (username) {
            const findData = new Promise(async (resolve, reject) => {
                resolve(
                    await reviewer.find(
                        {
                            $or:
                                [
                                    { name: { $regex: username, $options: "i" } },
                                    { email: { $regex: username, $options: "i" } }
                                ],
                            isDeleted: false,
                            // createdAt: { $gte: new Date(fromDate), $lt: new Date(toDate) }
                        })
                        .sort({ name: 1 })
                        .limit(limit * 1)
                        .skip((page - 1) * limit)
                        .select({ _id: 0, name: 1, email: 1, createdAt: 1, userType: 1, isDeleted: 1 }));
            });
            findData
                .then((reviewerData) => {
                    return new Promise(async (resolve, reject) => {
                        resolve(
                            await buisness.find(
                                {
                                    $or:
                                        [
                                            { companyName: { $regex: username, $options: "i" } },
                                            { email: { $regex: username, $options: "i" } }
                                        ],
                                    isDeleted: false,
                                    // createdAt: { $gte: new Date(fromDate), $lt: new Date(toDate) }
                                })
                                .sort({ companyName: 1 })
                                .limit(limit * 1)
                                .skip((page - 1) * limit)
                                .select({ _id: 0, companyName: 1, email: 1, createdAt: 1, userType: 1, isDeleted: 1 }));
                    }).then((buisnessData) => {
                        return res.status(statusCodes[200].value).send({ data: reviewerData.concat(buisnessData) });
                    });
                });
        }
    }
    catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
};

const searchWithDate = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const startindex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = {};
        if (fromDate && toDate) {
            result.createdAt = { $gte: new Date(fromDate), $lt: new Date(toDate) };
        }
        if (endIndex < adminData.length) {
            result.next = {
                page: page + 1,
                limit: limit
            };
        }
        if (startindex > 0) {
            result.previous = {
                page: page - 1,
                limit: limit
            };
        }
        result.results = await adminModel.find({ $and: [{ isDeleted: false }, result] }).limit(limit).skip(startindex).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0, password: 0 });
    } catch (error) {
        return res.status(statusCodes[500].value).send({ msg: error.message });
    }
}


module.exports = {
    dashboard,
    getAllUsers
}