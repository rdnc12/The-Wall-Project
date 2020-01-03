const async = () => {
  return Promise.resolve();
};

const { port, uri } = require("./config/index");

async()
  .then(() => require("./db/database").init(uri))
  .then(() => require("./db/models"))
  .then(models => require("./app").init(models.initUser, models.initPost))
  .then(app => {
    setTimeout(() => {
      app.listen(port, () => {
        console.log(`Server started perfectly on ${port}...`);
      });
    }, 200);
  })
  .catch(err => {
    console.log(err);
  });
