const mongoose = require("mongoose");
const moment = require("moment");

const initPost = () => {
  const postSchema = new mongoose.Schema({
    post: {
      type: String,
      max: 500,
      default: ""
    },
    comment: {
      type: String,
      max: 500,
      default: ""
    },
    created: {
      type: Date,
      default: new moment()
    },
    like: {
      type: Number,
      default: 0
    },
    dislike: {
      type: Number,
      default: 0
    },
    googleId: String,
    facebookId: String,
    _username: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User"
    }
  });

  const Post = Promise.resolve(new mongoose.model("Post", postSchema));
 
  return Post;
};

module.exports = {initPost};
