import { User } from "../models/User.model.js";
import passport from "passport";
// import LocalStrategy from "passport-local";
import { Strategy as LocalStrategy } from "passport-local";
import { ApiError } from "../utils/ApiError.js";

// this is authenticator function , this will be exicuted when we run passport.authenticate onlogin. This function have custome login to check if user exists and if exists then entred correct username/email and password.
// if user details are correct then this function will call the done callback with (null:error,user:userdeatils).
// This function is to intialize the local strategy which can be later used when we call passport.authenticate('local').
const authenticatorFunc = async (username, password, done) => {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return done(
        new ApiError(400, `User not found with provided Username - ${username}`)
      );
    }
    if (!user.validatePassword(user.password)) {
      return done(new ApiError(400, `Provided Password is Incorrect`));
    }
    done(null, user);
  } catch (error) {
    return done(
      new ApiError(error.statusCode, error.message, error.errors, error.stack)
    );
  }
};

// initiate the Localstategy and add it to passport middleware
export const initiatePassportMiddleware = () =>
  passport.use(new LocalStrategy(authenticatorFunc));

// serializing user will add userdetails provided in done call back to the session.passport - This can be a Id or username which can be later in deserializeUser used to fetch the user details from DB to add user in session
passport.serializeUser((user, done) => {
  // console.log(req.session,"session");
  console.log(user, "in serialize");
  done(null, user?._id);
});

// This function is used when any subsequent request comes after login , this method will get the user field/detail passed from serialized user method. buy this field this method will fetch the user from DB and add that to session/req object
// which can be used as req.user
passport.deserializeUser((user, done) => {
  console.log(user, "in deserialize");
  done(null, user);
});
