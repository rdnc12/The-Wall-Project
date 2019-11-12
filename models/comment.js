const mongoose = require('mongoose');
const moment = require('moment');

const postSchema = new mongoose.Schema({
    comment: {
        type: String,
        max: 500,
        default: 0
    },
    time: {
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
    }
});

const Post = new mongoose.model("Post", postSchema);