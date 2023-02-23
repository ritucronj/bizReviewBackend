const buisness = require("../../Buisness-module/models/business.model");
const { statusCodes } = require("../utils/statusCodes");

const searchBuisness = async (req, res) => {
    try {
        const { companyName, website, page = 1, limit = 10 } = req.query;
        const queryFilter = {};
        // queryFilter.isDeleted = false;
        if (companyName) {
            queryFilter.companyName = { $regex: companyName, $options: "i" };
        }
        if (website) {
            queryFilter.website = { $regex: website, $options: "i" };
        }
        let result = await buisness
            .find(queryFilter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select({ companyName: 1, website: 1, logo: 1, location: 1, _id: 0, uId: 1 });
        if (result.length === 0) return res.status(statusCodes[404].value).send({ msg: statusCodes[404].message });
        res.send(result);
    } catch (error) {
        return res.status(statusCodes[500].value).send({ status: statusCodes[500].message, msg: error.message });

    }
}

module.exports = {
    searchBuisness
}