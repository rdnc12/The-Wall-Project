
require("dotenv").config();
const port = process.env.PORT || 5000;
const uri = process.env.ATLAS_URI;

module.exports = { port, uri };
