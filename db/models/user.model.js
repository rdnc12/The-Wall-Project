const mongoose = require("mongoose");
const passport = require("passport");
const findOrCreate = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const initUser = () => {
  
  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      min: 3,
      max: 20
    },
    picture: {
      type: String,
      default: "https://picsum.photos/50/50/?random"
    },
    password: {
      type: String,
      min: 6,
      max: 20
    },
    email: {
      type: String,
      unique: true,
      required: true
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },
    dob: { type: Date }
  });
  userSchema.plugin(passportLocalMongoose);
  userSchema.plugin(findOrCreate);

  const User = new mongoose.model("User", userSchema);

  passport.use(User.createStrategy());
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  /// GOOGLE LOGIN ///
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const existingUser = await User.findOne({ googleId: profile.id });
          if (existingUser) {
            return done(null, existingUser);
          }
          const user = await new User({
            googleId: profile.id,
            displayName: profile.displayName
          }).save();
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );

  /// FACEBOOK LOGIN ///
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.APP_ID,
        clientSecret: process.env.APP_SECRET,
        callbackURL: "http://localhost:3001/auth/facebook/home"
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          const existingUser = await User.findOne({ facebookId: profile.id });
          if (existingUser) {
            return cb(null, existingUser);
          }
          const user = await new User({
            facebookId: profile.id,
            displayName: profile.displayName
          }).save();
          cb(null, user);
        } catch (err) {
          cb(err, null);
        }
      }
    )
  );
  return Promise.resolve(User);
};

module.exports =  {initUser} ;
