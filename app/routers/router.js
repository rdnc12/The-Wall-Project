const fs = require('fs');
const path = require('path');

const attachTo = (app) => {

    app.get('/', (req, res) => {
        return res.render('home');
    });

    // dynamically require modules in node.js by scanning a directory
    fs.readdirSync(__dirname)
        .filter((file) => file.includes('.router'))
        .forEach((file) => {
            const modulePath = path.join(__dirname, file);
            require(modulePath).attachTo(app);
        });
};

module.exports = { attachTo };