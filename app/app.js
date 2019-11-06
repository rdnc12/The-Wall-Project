const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require("passport");
const ejs = require("ejs");

const init = () => {
    const app = express();

    // config start
    //for making ejs usable in views folder
    app.set("view engine", "ejs");
    // for post requests
    app.use(bodyParser.urlencoded({ extended: true }));
    //for using css js img files
    app.use(express.static("public"));

    app.use(session({
        secret: "erdinc",
        resave: false,
        saveUninitialized: false
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    app.use('/libs', express.static(path.join(__dirname, '../node_modules/')));
    // config end

    require('./routers').attachTo(app);

    return Promise.resolve(app);
};

module.exports = {
    init
};