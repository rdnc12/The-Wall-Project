require('dotenv').config();
const findOrCreate = require('mongoose-findorcreate');
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const config = require('../config');


const init = () => {
    mongoose.connect(config.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    mongoose.set("useCreateIndex", true);

    const userSchema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            min: 3,
            max: 30
        },
        password: {
            type: String,
            required: true,
            min: 6
        },
        email: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Others"]
        },
        dob: { type: Date },
        comment: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Post'
        }]
    });

    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);

    const User = mongoose.model("User", userSchema);

    const postSchema = new mongoose.Schema({
        comment: {
            type: String,
            max: 500
        },
        time: {
            type: Date,
            default: Date.now
        },
        like: {
            type: Number,
            default: 0
        },
        dislike: {
            type: Number,
            default: 0
        }
    });
    postSchema.plugin(passportLocalMongoose);
    postSchema.plugin(findOrCreate);

    const Post = mongoose.model("Post", postSchema);
    passport.use(User.createStrategy());
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
    /// GOOGLE LOGIN ///
    passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
        function (accessToken, refreshToken, profile, cb) {
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    ));

    /// FACEBOOK LOGIN ///
    passport.use(new FacebookStrategy({
        clientID: process.env.APP_ID,
        clientSecret: process.env.APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
        function (accessToken, refreshToken, profile, cb) {
            User.findOrCreate({ facebookId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    ));

};

module.exports = { init };