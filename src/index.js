const express = require('express');
const app = express();
const mongoose = require('mongoose');
const userRoutes = require('./Reviewers-module/routes/user.routes');
const cors = require('cors');
require('dotenv').config();


app.use(express.json());
app.use(cors());
app.use('/api/users', userRoutes);


mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true })
    .then(() => console.log(`MongoDB Connection Successful`))
    .catch((err) => console.log(err));


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express App running on port ${port}`);
})