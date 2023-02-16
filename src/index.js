require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const userRoutes = require('./Reviewers-module/routes/user.routes');
const reviewRoutes = require("./Reviewers-module/routes/review.routes");
const cors = require('cors');
const session = require("express-session");

app.use(express.json());
app.use(cors());
app.use('/api/users', userRoutes);
app.use('/api/users/reviews', reviewRoutes);

app.set('view engine', 'ejs');

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET'
}));

app.get('/', function (req, res) {
    res.render('pages/auth');
});


mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true })
    .then(() => console.log(`MongoDB Connection Successful`))
    .catch((err) => console.log(err));


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express App running on port ${port}`);
});



const passport = require('passport');
var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.get('/success', (req, res) => res.send(userProfile));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});



const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        userProfile = profile;
        return done(null, userProfile);
    }
));


app.get('/auth/google',
passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function (req, res) {
        // Successful authentication, redirect success.
        res.redirect('/success');
    });