require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require('path');
const validator = require("validator");
const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate');
const fs = require('fs');
const _ = require('lodash');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const config = require('./config');

// config start
const app = express();

app.set("view engine", "ejs"); //for making ejs usable in views folder
app.use(bodyParser.urlencoded({ extended: true })); // for post requests
app.use(express.static("public")); //for using css js img files
//app.use('/libs', express.static(path.join(__dirname, 'node_modules')));
app.use(session({
    secret: "erdinc",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
//config end


// mongoose config
console.log(Date.now());
mongoose.connect(config.connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);


// mongoose schema config

const postSchema = new mongoose.Schema({
    comment: {
        type: String,
        max: 500,
        default: 0
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

const Post = new mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        min: 3,
        max: 20
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 20
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"]
    },
    dob: { type: Date },
    comment: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Post'
    }]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
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
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
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
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));
app.get('/', (req, res) => {
    res.render('home');
});

/// Login page
app.route("/login")
    .get((req, res) => {
        res.render("loginpage");
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        if (validator.isEmpty(req.body.username) || validator.isEmpty(req.body.password)) {
            res.send("Username and Password cannot be empty");
        } else {
            req.login(user, (err) => {
                if (!err) {
                    passport.authenticate("local")(req, res, () => {
                        res.redirect('/comment');
                        //res.render("comment", { usernameLogin: req.body.username });
                    });
                } else {
                    res.send("<h1> 401 Unauthorized</h1><hr><p>You are redirect to Home in 3 seconds</p>");
                    // .then(setTimeout(res.redirect('/home'), 3000));
                }
            });
        }
    });

/// GOOGLE LOGIN SIDE ///
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
        res.redirect('/secrets');
    });

/// FACEBOOK LOGIN SIDE ///
app.get("/auth/facebook",
    passport.authenticate("facebook")
);

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: "/login" }),
    function(req, res) {
        res.redirect('/secrets');
    });
/// register page
app.route("/register")
    .get((req, res) => {
        res.render("registerpage");
    })
    .post((req, res) => {
        let usernameNew = req.body.username;
        let passwordNew = req.body.password;
        let genderNew = req.body.gender;
        let emailNew = req.body.email;
        let dobNew = req.body.dob;

        if (validator.isEmail(emailNew)) {
            if (!validator.isEmpty(usernameNew)) {
                if (!validator.isEmpty(passwordNew)) {
                    if (validator.isLength(usernameNew, { min: 3, max: 20 })) {
                        if (validator.isLength(passwordNew, { min: 6, max: 20 })) {
                            User.register({
                                username: usernameNew,
                                password: passwordNew,
                                email: emailNew,
                                gender: genderNew,
                                dob: dobNew
                            }, passwordNew, (err, user) => {
                                if (err) {
                                    console.log(err);
                                    res.redirect("/register");
                                } else {
                                    passport.authenticate("local")(req, res, () => {
                                        res.redirect("/comment");
                                    });
                                }
                            });
                        } else { console.log('1'); }
                    } else { console.log('2'); }
                } else { console.log('3'); }
            } else { console.log('4'); }
        } else { console.log('5'); }
    });

// for getting sending and deleting comment
app.route("/comment")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            User.find({ "username": { $ne: null } }, (err, foundUser) => {
                if (!err) {
                    if (foundUser) {
                        res.render('comment', { usersWithComments: foundUser, username: req.user.username });
                    }
                } else {
                    console.log(err);
                    // res.status(400).send();
                }
            }).populate('comment', ['comment']);
        } else {
            res.redirect("/login");
        }
    })
    .post((req, res) => {
        let newComment = req.body.comment;
        User.findOne(req.user.username, (err, foundUser) => {
            if (!err) {
                if (foundUser) {
                    if (newComment == '') {
                        res.send("Empty Post!!!");
                    } else {
                        const newPost = new Post({
                            comment: newComment
                        });
                        newPost.save().then(() =>
                            res.redirect("comment")
                        );
                    }
                }
            }
        }).populate('comment', ['comment']);
    })
    .delete((req, res) => {
        let id = req.params;
        Post.deleteOne({ _id: id }, (err) => {
            if (!err) {
                res.redirect("/comment");
            }
        });
    });


/// like and dislike control
app.post("comment/like/:id", (req, res) => {
    let id = req.params;
    Post.findById(id, (req, res) => {
        res.like = res.like + 1;
        res.save();
        res.redirect("/comment");
    });
});

app.post("comment/dislike/:id", (req, res) => {
    let id = req.params;
    Post.findById(id, (req, res) => {
        res.dislike = res.dislike + 1;
        res.save();
        res.redirect("/home");
    });
});


app.listen(config.port, function() {
    console.log(`Server started perfectly on ${config.port}...`);
});