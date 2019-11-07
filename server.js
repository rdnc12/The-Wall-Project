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


const app = express();
//for making ejs usable in views folder
app.set("view engine", "ejs");
// for post requests
app.use(bodyParser.urlencoded({ extended: true }));
//for using css js img files
app.use(express.static("public"));
app.use('/libs', express.static(path.join(__dirname, 'node_modules')));
console.log(path.join(__dirname, 'node_modules'));

app.use(session({
    secret: "erdinc",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

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
        res.render("login");
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        if (!validator.isEmpty(usernameInput) || !validator.isEmpty(passwordInput)) {
            res.send("Username and Password cannot be empty");
        } else {
            req.login(user, (err) => {
                if (!err) {
                    passport.authenticate("local", { failureRedirect: '/login' })(req, res, () => {
                        res.redirect("/home");
                    });
                } else {
                    res.status(401).send("401 Unauthorized");
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
    .post(async(req, res) => {
        let usernameNew = req.body.username;
        let passwordNew = req.body.password;
        let genderNew = req.body.gender;
        let emailNew = req.body.email;
        let dobNew = req.body.dob;

        if (validator.isEmail(emailNew)) {
            if (!validator.isEmpty(usernameNew)) {
                if (!validator.isEmpty(passwordNew)) {
                    if (validator.isLength(usernameNew, { min: 3, max: 8 })) {
                        if (validator.isLength(passwordNew, { min: 6 })) {
                            await User.findOne({ username: usernameNew },
                                (err, foundUser) => {
                                    if (!err) {
                                        if (!foundUser) {
                                            User.register({
                                                username: usernameNew,
                                                email: emailNew,
                                                gender: genderNew,
                                                dob: dobNew
                                            }, req.body.password, (err, user) => {
                                                if (err) {
                                                    res.redirect("/register");
                                                } else {
                                                    passport.authenticate("local")(req, res, () => {
                                                        res.redirect("/comment");
                                                    });
                                                }
                                            });
                                        } else {
                                            res.send("username or email are already in use.");
                                        }
                                    }
                                });
                        } else { console.log('1'); }
                    } else { console.log('2'); }
                } else { console.log('3'); }
            } else { console.log('4'); }
        } else { console.log('5'); }
    });

// for getting sending and deleting comment
app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("comment");
        } else {
            res.redirect("/login");
        }
    })
    .post(async(req, res) => {
        let newComment = req.body.comment;

        User.findById(req.user.id, (err, foundUser) => {
            if (!err) {
                if (foundUser) {
                    if (validator.isEmpty(newComment, { max: 500 })) {
                        res.send("Empty Post!!!");
                    } else {
                        const newPost = new Post({
                            comment: newComment
                        });
                        newPost.save().then(() =>
                            res.redirect("comment"));
                    }
                }
            }
        });
    })
    .delete(async(req, res) => {
        let id = req.params;
        await Post.deleteOne({ _id: id }, (err) => {
            if (!err) {
                res.redirect("/comment");
            }
        });
    });


/// like and dislike control
app.get("comment/like/:id", async(req, res) => {
    let id = req.params;
    await Post.findById(id, (req, res) => {
        res.like = res.like + 1;
        res.save();
        res.redirect("/comment");
    });
});

app.get("comment/dislike/:id", async(req, res) => {
    let id = req.params;
    await Post.findById(id, (req, res) => {
        res.dislike = res.dislike + 1;
        res.save();
        res.redirect("/home");
    });
});

app.get('/comment', (req, res) => {
    res.render('comment');
});

app.listen(config.port, function() {
    console.log(`Server started perfectly on ${config.port}...`);
});