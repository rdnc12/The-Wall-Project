const validator = require("validator");

const attachTo = (app) => {
    /// register page
    app.route("/register")
        .get((req, res) => {
            res.render("register");
        })
        .post(async (req, res) => {
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
                                                            res.redirect("/home");
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
                res.render("home");
            } else {
                res.redirect("/login");
            }
        })
        .post(async (req, res) => {
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
                                res.redirect("home"));
                        }
                    }
                }
            });
        })
        .delete(async (req, res) => {
            let id = req.params;
            await Post.deleteOne({ _id: id }, (err) => {
                if (!err) {
                    res.redirect("/home");
                }
            });
        });


    /// like and dislike control
    app.get("home/like/:id", async (req, res) => {
        let id = req.params;
        await Post.findById(id, (req, res) => {
            res.like = res.like + 1;
            res.save();
            res.redirect("/home");
        });
    });

    app.get("home/dislike/:id", async (req, res) => {
        let id = req.params;
        await Post.findById(id, (req, res) => {
            res.dislike = res.dislike + 1;
            res.save();
            res.redirect("/home");
        });
    });
};

module.exports = { attachTo };