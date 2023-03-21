require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require('node-cron');
const Business = require('./Buisness-module/models/business.model');

const app = express();

const userRoutes = require("./Reviewers-module/routes/user.routes");
const reviewRoutes = require("./Reviewers-module/routes/review.routes");
// const reviewRoutes = require("./Review-module/routes/review.routes");
const businessRoutes = require("./Buisness-module/routes/buisness.routes");
//const otpRoutes = require("./utils/Otp"); //[Old implementation]
const search = require("./search-module/routes/search.routes");
const adminRoutes = require("./admin-module/routes/admin.routes");
const dashboardRoutes = require("./admin-module/routes/dashboard.routes");
const paypalRoutes = require("../src/Buisness-module/paypal");
const stripeRoutes = require("../src/Buisness-module/Stripe");
const otpRoutes = require("../src/Reviewers-module/controller/otp.controller");
const uploadRoutes = require("../src/Reviewers-module/controller/s3Bucket.controller");

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/users/reviews", reviewRoutes);
app.use("/api", businessRoutes);
app.use("/api/search", search);
app.use("/api/admin", adminRoutes, dashboardRoutes);
app.use("/api", otpRoutes,uploadRoutes);
app.use("/", paypalRoutes);
app.use("/", stripeRoutes);

mongoose
  .connect(process.env.DB_CONNECTION, { useNewUrlParser: true })
  .then(() => console.log(`MongoDB Connection Successful`))
  .catch((err) => console.log(err));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express App running on port ${port}`);
});

cron.schedule('0 0 * * *', async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const businessesToUpdate = await Business.find({
      planPurchaseDate: { $lt: thirtyDaysAgo },
      isPlanExpired: { $ne: true }
    });

    businessesToUpdate.forEach(async business => {
      business.isPlanExpired = true;
      business.planType='free';
      await business.save();
    });

    console.log(`Updated ${businessesToUpdate.length} businesses.`);
  } catch (err) {
    console.error(err);
  }
});


