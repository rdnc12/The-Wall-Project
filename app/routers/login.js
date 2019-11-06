const attachTo = (app) => {
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
        function (req, res) {
            res.redirect('/secrets');
        });

    /// FACEBOOK LOGIN SIDE ///
    app.get("/auth/facebook",
        passport.authenticate("facebook")
    );

    app.get('/auth/facebook/secrets',
        passport.authenticate('facebook', { failureRedirect: "/login" }),
        function (req, res) {
            res.redirect('/secrets');
        });

};
module.exports = { attachTo };