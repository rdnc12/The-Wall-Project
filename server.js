const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const validator = require("validator");
const mongoose = require("mongoose");
const fs = require('fs');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const config = require('./config/config');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
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
    username: { type: String, required: true, min: 8 },
    password: { type: String, required: true, min: 8 },
    email: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Others"] },
    dob: { type: Date }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema({
    comment: { type: String, max: 500 },
    time: { type: Date, default: Date.now },
    like: { type: Number, default: 0 },
    dislike: { type: Number, default: 0 },
    username: userSchema.add({
        username: { type: String, required: true, min: 8 }
    })
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


app.get("/", (req, res) => {
    res.render("login");
});

app.post("/home", (req, res) => {
    let usernameInput = req.body.username;
    let passwordInput = req.body.password;

    if (!validator.isEmpty(usernameInput) || !validator.isEmpty(passwordInput)) {
        res.send("Username and Password cannot be empty");
    } else {
        User.findOne(
            { username: usernameInput, password: passwordInput },
            (err, foundUser) => {
                if (!err) {
                    if (foundUser) {
                        res.redirect("/home");
                    } else {
                        res.send("Username or Password not Correct");
                    }
                } else {
                    res.status(401).send("401 Unauthorized");
                }
            }
        );
    }
});

app.post("/register", (req, res) => {
    let usernameNew = req.body.username;
    let passwordNew = req.body.password;
    let genderNew = req.body.gender;
    let emailNew = req.body.email;
    let dobNew = req.body.dob;

    if (validator.isEmail(emailNew)) {
        if (!validator.isEmpty(usernameNew)) {
            if (!validator.isEmpty(passwordNew)) {
                if (validator.isLength(usernameNew, { min: 8 })) {
                    if (validator.isLength(passwordNew, { min: 8 })) {
                        User.findOne(
                            { username: usernameNew },
                            (err, foundUser) => {
                                if (!err) {
                                    if (!foundUser) {
                                        const newUser = new User({
                                            username: usernameNew,
                                            email: emailNew,
                                            gender: genderNew,
                                            password: passwordNew,
                                            dob: dobNew
                                        });
                                        newUser.save();
                                        res.redirect("/home");
                                    } else {
                                        res.send("username or email are already in use.");
                                    }
                                }
                            }
                        );
                    } else { console.log('1'); }
                } else { console.log('2'); }
            } else { console.log('3'); }
        } else { console.log('4'); }
    } else { console.log('5'); }
});

app.router("home/:id")
    .get((req, res) => {
        let newPostId = req.params;
        let newComment = req.body.comment;

        if (validator.isEmpty(newComment, { max: 500 })) {
            res.send("Empty Post!!!");
        } else {
            const newPost = new Post({
                comment: newComment
            });
            newPost.save();
            newPostId = Post.findById(newPost._id, { lean: true });
            res.redirect("home/:id");
        }
    })
    .delete((req, res) => {
        let id = req.params;
        Post.deleteOne({ _id: id }, (err) => {
            if (!err) {
                res.redirect("/home");
            }
        });
    });

app.get("home/like/:id", (req, res) => {
    let id = req.params;
    Post.findById(id, (req, res) => {
        res.like = res.like + 1;
        res.save();
        res.redirect("/home");
    });
});

app.get("home/dislike/:id", (req, res) => {
    let id = req.params;
    Post.findById(id, (req, res) => {
        res.dislike = res.dislike + 1;
        res.save();
        res.redirect("/home");
    });
});


app.listen(3000, function () {
    console.log(`Server started perfectly on ${config.port}...`);
});