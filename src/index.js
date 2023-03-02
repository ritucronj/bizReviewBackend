require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const userRoutes = require("./Reviewers-module/routes/user.routes");
const reviewRoutes = require("./Reviewers-module/routes/review.routes");
const businessRoutes = require("./Buisness-module/routes/buisness.routes");
//const otpRoutes = require("./utils/Otp"); //[Old implementation]
const search = require("./search-module/routes/search.routes");
const adminRoutes = require("./admin-module/routes/admin.routes");
const dashboardRoutes = require("./admin-module/routes/dashboard.routes");
const paypalRoutes = require("../src/Buisness-module/paypal");
const otpRoutes = require("../src/Reviewers-module/controller/otp.controller");

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/users/reviews", reviewRoutes);
app.use("/api", businessRoutes);
app.use("/api/search", search);
app.use("/api/admin", adminRoutes, dashboardRoutes);
app.use("/api", otpRoutes);
app.use("/", paypalRoutes);

mongoose
  .connect(process.env.DB_CONNECTION, { useNewUrlParser: true })
  .then(() => console.log(`MongoDB Connection Successful`))
  .catch((err) => console.log(err));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express App running on port ${port}`);
});
