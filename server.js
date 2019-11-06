

const async = () => {
    return Promise.resolve();
};

const config = require('./config/index');
// after solving async function. First make a connection in mongoDB then
async()
    .then(() => require('./db').init())
    .then(() => require('./config').init())
    .then(() => require('./app').init())
    .then((app) => {
        app.listen(config.port, () => console.log(`Server started perfectly on ${config.port}...`));
       
    }).catch((err) => {
        console.log(err);
    });

// //for making ejs usable in views folder
// app.set("view engine", "ejs");
// // for post requests
// app.use(bodyParser.urlencoded({ extended: true }));
// //for using css js img files
// app.use(express.static("public"));

// app.use(session({
//     secret: "erdinc",
//     resave: false,
//     saveUninitialized: false
// }));


// app.use(passport.initialize());
// app.use(passport.session());

// mongoose.connect(config.connectionString, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });
// mongoose.set("useCreateIndex", true);

// const userSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: true,
//         min: 3,
//         max: 30
//     },
//     password: {
//         type: String,
//         required: true,
//         min: 6
//     },
//     email: {
//         type: String,
//         required: true
//     },
//     gender: {
//         type: String,
//         enum: ["Male", "Female", "Others"]
//     },
//     dob: { type: Date },
//     comment: [{
//         type: mongoose.SchemaTypes.ObjectId,
//         ref: 'Post'
//     }]
// });

// userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);

// const User = mongoose.model("User", userSchema);

// const postSchema = new mongoose.Schema({
//     comment: {
//         type: String,
//         max: 500
//     },
//     time: {
//         type: Date,
//         default: Date.now
//     },
//     like: {
//         type: Number,
//         default: 0
//     },
//     dislike: {
//         type: Number,
//         default: 0
//     }
// });
// postSchema.plugin(passportLocalMongoose);
// postSchema.plugin(findOrCreate);

// const Post = mongoose.model("Post", postSchema);

// passport.use(User.createStrategy());
// passport.serializeUser(function (user, done) {
//     done(null, user.id);
// });

// passport.deserializeUser(function (id, done) {
//     User.findById(id, function (err, user) {
//         done(err, user);
//     });
// });

// /// GOOGLE LOGIN ///
// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
// },
//     function (accessToken, refreshToken, profile, cb) {
//         User.findOrCreate({ googleId: profile.id }, function (err, user) {
//             return cb(err, user);
//         });
//     }
// ));

// /// FACEBOOK LOGIN ///
// passport.use(new FacebookStrategy({
//     clientID: process.env.APP_ID,
//     clientSecret: process.env.APP_SECRET,
//     callbackURL: "http://localhost:3000/auth/facebook/secrets"
// },
//     function (accessToken, refreshToken, profile, cb) {
//         User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//             return cb(err, user);
//         });
//     }
// ));

// /// Login page
// app.route("/login")
//     .get((req, res) => {
//         res.render("login");
//     })
//     .post((req, res) => {
//         const user = new User({
//             username: req.body.username,
//             password: req.body.password
//         });
//         if (!validator.isEmpty(usernameInput) || !validator.isEmpty(passwordInput)) {
//             res.send("Username and Password cannot be empty");
//         } else {
//             req.login(user, (err) => {
//                 if (!err) {
//                     passport.authenticate("local", { failureRedirect: '/login' })(req, res, () => {
//                         res.redirect("/home");
//                     });
//                 } else {
//                     res.status(401).send("401 Unauthorized");
//                 }
//             });
//         }
//     });
// /// GOOGLE LOGIN SIDE ///
// app.get("/auth/google",
//     passport.authenticate("google", { scope: ["profile"] })
// );

// app.get('/auth/google/secrets',
//     passport.authenticate('google', { failureRedirect: "/login" }),
//     function (req, res) {
//         res.redirect('/secrets');
//     });

// /// FACEBOOK LOGIN SIDE ///
// app.get("/auth/facebook",
//     passport.authenticate("facebook")
// );

// app.get('/auth/facebook/secrets',
//     passport.authenticate('facebook', { failureRedirect: "/login" }),
//     function (req, res) {
//         res.redirect('/secrets');
//     });





// app.listen(config.port, function () {
//     console.log(`Server started perfectly on ${config.port}...`);
// });