const attachTo = (app, postModel) => {
  // for getting sending and deleting post

  app.get("/post", async (req, res) => {
    if (req.isAuthenticated()) {
      //const postsAll = await Post.find({ _username: req.user.id });
      const postsAll = await postModel
        .find({ _username: { $ne: null } })
        .populate("_username", ["username", "picture"])
        .sort({ created: "desc" });

      res.render("post", {
        users: postsAll,
        loginInf: req.user,
        moment,
        menuId: "post"
      });
    } else {
      res.redirect("/");
    }
  });
  app.post("/post", async (req, res) => {
    let { newpost, newcomment } = req.body;

    const newPost = new postModel({
      post: newpost,
      comment: newcomment,
      _username: req.user.id,
      created: new moment()
    });

    try {
      await newPost.save();
      // res.send(newPost);
      res.redirect("post");
    } catch (err) {
      res.status(400).send(err);
    }
  });

  /// like, dislike and delete control
  app.get("/post/like/:id", async (req, res) => {
    let { id } = req.params;
    await postModel.findById(id).then(post => {
      post.like = post.like + 1;
      post.save().then(() => {
        res.redirect("/post");
      });
    });
  });

  app.get("/post/dislike/:id", async (req, res) => {
    let { id } = req.params;
    await postModel.findById(id).then(post => {
      post.dislike = post.dislike + 1;
      post.save().then(() => {
        res.redirect("/post");
      });
    });
  });
  app.get("/post/delete/:id", async (req, res) => {
    let { id } = req.params;

    await postModel.findByIdAndRemove(id, err => {
      if (!err) {
        res.redirect("/post");
      } else {
        console.log(err);
      }
    });
  });
};

module.exports = { attachTo };
