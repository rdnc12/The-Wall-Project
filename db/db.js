const findOrCreate = require('mongoose-findorcreate');
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const config = require('../config');


const init = () => {
    mongoose.connect(config.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    mongoose.set("useCreateIndex", true);

    const userSchema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            min: 3,
            max: 30
        },
        password: {
            type: String,
            required: true,
            min: 6
        },
        email: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Others"]
        },
        dob: { type: Date },
        comment: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Post'
        }]
    });

    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);

    const User = mongoose.model("User", userSchema);

    const postSchema = new mongoose.Schema({
        comment: {
            type: String,
            max: 500
        },
        time: {
            type: Date,
            default: Date.now
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
    postSchema.plugin(passportLocalMongoose);
    postSchema.plugin(findOrCreate);

    const Post = mongoose.model("Post", postSchema);

}

module.exports = { init };