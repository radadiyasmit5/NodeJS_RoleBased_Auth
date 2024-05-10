const User = require("../models/User")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy

const authenticatorFunc = async (username, password, done) => {
  try {
    const user = await User.findOne({username})
    // done(null, {username, password})
    if (!user) {
      throw new Error(`User not found with provided Username - ${username}`)
    }
    if (user.password !== password) {
      throw new Error(`Provided Password is Incorrect`)
    }
    done(null, user)
  } catch (error) {
    done(error)
  }
}
passport.use(new LocalStrategy(authenticatorFunc))

passport.serializeUser((user, done) => {
  console.log(user, "in serialize")
  done(null, user)
})
// passport.serializeUser()
passport.deserializeUser((user, done) => {
  console.log(user, "in deserialize")
  done(null, user)
})
