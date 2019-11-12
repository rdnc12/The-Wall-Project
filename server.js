require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const validator = require("validator");
const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate');
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

mongoose.connect(config.connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);


// mongoose schema config

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
    dob: { type: Date }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema({
    comment: {
        type: String,
        max: 500,
        default: ''
    },
    created: {
        type: Date,
        default: new moment()
    },
    like: {
        type: Number,
        default: 0
    },
    dislike: {
        type: Number,
        default: 0
    },
    _username: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }
});

const Post = new mongoose.model("Post", postSchema);

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
passport.use(
    new GoogleStrategy({
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
            proxy: true
        },
        async(accessToken, refreshToken, profile, done) => {
            try {
                const existingUser = await User.findOne({ googleId: profile.id });
                if (existingUser) {
                    return done(null, existingUser);
                }
                const user = await new User({
                    googleId: profile.id,
                    displayName: profile.displayName
                }).save();
                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

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
    passport.authenticate("google", { scope: ['profile', 'email'] })
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
                    if (validator.isLength(usernameNew, { min: 3, max: 20 })) {
                        if (validator.isLength(passwordNew, { min: 6, max: 20 })) {
                            await User.register({
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
                                        res.redirect("/login");
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
    .get(async(req, res) => {
        if (req.isAuthenticated()) {
            //const commentsAll = await Post.find({ _username: req.user.id });
            const commentsAll = await Post.find({ _username: { $ne: null } })
                .populate('_username', ['username']);
            //console.log(commentsAll);
            res.render('comment', { users: commentsAll, username: req.user.username, moment });
        } else {
            res.redirect("/login");
        }
    })
    .post(async(req, res) => {
        let newComment = req.body.comment;

        const newPost = new Post({
            comment: _.capitalize(newComment.toString()),
            _username: req.user.id,
            created: new moment()
        });
        try {
            await newPost.save();
            // res.send(newPost);
            res.redirect("comment");
        } catch (err) {
            res.status(400).send(err);
        }
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
app.get("/comment/like/:id", async(req, res) => {
    let { id } = req.params;
    await Post.findById(id).then(post => {
        post.like = post.like + 1;
        post.save().then(like => {
            res.redirect("/comment");
        });
    });
});

app.get("/comment/dislike/:id", async(req, res) => {
    let { id } = req.params;
    await Post.findById(id).then(post => {
        post.dislike = post.dislike + 1;
        post.save().then(dislike => {
            res.redirect("/comment");
        });
    });
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});


app.listen(config.port, function() {
    console.log(`Server started perfectly on ${config.port}...`);
});