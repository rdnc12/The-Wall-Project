const fs = require("fs");
const path = require("path");
const validator = require("validator");
const passport = require("passport");

const attachTo = (app, UserModel, PostModel) => {
  console.log(UserModel,PostModel);
  // Login page
  app
    .route("/")
    .get((req, res) => {
      let copyDate = new Date().getFullYear();
      res.render("loginpage", { menuId: "login", copyDate });
    })
    .post((req, res) => {
      const userLogin =  new UserModel({
        username: req.body.username,
        password: req.body.password
      });
      if (
        validator.isEmpty(req.body.username) ||
        validator.isEmpty(req.body.password)
      ) {
        res.send("Username and Password cannot be empty");
      } else {
        req.login(userLogin, err => {
          if (!err) {
            passport.authenticate("local", { failureRedirect: "/" })(
              req,
              res,
              () => {
                res.redirect("/post");
                //res.render("post", { usernameLogin: req.body.username });
              }
            );
          } else {
            res.send(
              "<h1> 401 Unauthorized</h1><hr><p>You are redirect to Home in 3 seconds</p>"
            );
            //setTimeout(res.redirect("/"), 3000);
          }
        });
      }
    });

  /// GOOGLE LOGIN SIDE ///
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/post",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
      res.redirect("/post");
    }
  );
  /// register page
  app
    .route("/register")
    .get((req, res) => {
      res.render("registerpage", { menuId: "register" });
    })
    .post(async (req, res) => {
      let { usernameNew, passwordNew, genderNew, emailNew, dobNew } = req.body;

      if (validator.isEmail(emailNew)) {
        if (!validator.isEmpty(usernameNew)) {
          if (!validator.isEmpty(passwordNew)) {
            if (validator.isLength(usernameNew, { min: 3, max: 20 })) {
              if (validator.isLength(passwordNew, { min: 6, max: 20 })) {
                await UserModel.register(
                  {
                    username: usernameNew,
                    email: emailNew,
                    gender: genderNew,
                    dob: dobNew
                  },
                  passwordNew,
                  (err, user) => {
                    if (err) {
                      console.log(err);
                      res.redirect("/register");
                    } else {
                      passport.authenticate("local")(req, res, () => {
                        res.redirect("/");
                      });
                    }
                  }
                );
              } else {
                console.log("1");
              }
            } else {
              console.log("2");
            }
          } else {
            console.log("3");
          }
        } else {
          console.log("4");
        }
      } else {
        console.log("5");
      }
    });

  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  fs.readdirSync(__dirname)
    .filter(file => file.includes("Routes"))
    .forEach(file => {
      const modulePath = path.join(__dirname, file);
      require(modulePath).attachTo(app, PostModel);
    });
};

module.exports = { attachTo };
