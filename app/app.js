const express = require("express");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const bodyParser = require("body-parser");

const init = (user, post) => {
  const app = express();

  // config start
  app.set("view engine", "ejs"); //for making ejs usable in views folder
  app.use(bodyParser.urlencoded({ extended: true })); // for post requests
  app.use(express.static("public")); //for using css js img files
  app.use(flash());
  //app.use('/libs', express.static(path.join(__dirname, 'node_modules')));
  app.use(
    session({
      secret: "*@Tu@Er@*", // secret string used in the signing of the session ID that is stored in the cookie
      name: "tsme", // a unique name to remove the default connect.sid
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // minimize risk of XSS attacks by restricting the client from reading the cookie
        secure: true // only send cookie over https
      }
    })
  ); // control users session

  app.use(passport.initialize());
  app.use(passport.session());
  //config end

  require("../app/routers").attachTo(app, user, post);

  return Promise.resolve(app);
};

module.exports = { init };
