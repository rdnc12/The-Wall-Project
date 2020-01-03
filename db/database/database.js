const mongoose = require("mongoose");

const init = uri => {
  const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  };
  mongoose
    .connect(uri, options)
    .then(() =>
      console.log("MongoDB database connection established successfully")
    )
    .catch(err => console.log(err));
  mongoose.set("useCreateIndex", true);
};
module.exports = { init };
