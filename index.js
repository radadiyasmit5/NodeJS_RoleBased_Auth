const cors = require("cors")
const {success, error} = require("consola")
const bodyParser = require("body-parser")
const {application} = require("express")
const express = require("express")
const app = express()
const morgan = require("morgan")
const {default: mongoose} = require("mongoose")
const session = require("express-session")
const {APP_DB, PORT} = require("./config/index")
const passport = require("passport")
const {loginMiddleware} = require("./middlewares/authMiddlewares")
const MongoDBStore = require("connect-mongodb-session")(session)
const routes = require("./routes/index")
// middlewares
app.use(
  cors({
    origin: "*",
  })
)

app.use(morgan("dev"))
app.use(bodyParser.json({limit: "2mb"}))
app.use(express.urlencoded({extended: true}))
var store = new MongoDBStore({
  uri: APP_DB,
  collection: "express-session",
})
app.use(
  session({
    secret: "test secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {maxAge: 1000 * 60 * 60},
  })
)
require("./middlewares/passport-local-strategy")

app.use(passport.initialize())
app.use(passport.session())
app.use(routes)
//start app
const startApp = async () => {
  try {
    await mongoose.connect(APP_DB, {
      //   useFindAndModify: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    success({
      message: `Successfully connected with the Database`,
      badge: true,
    })

    app.listen(PORT, () => {
      console.log("server started on port", PORT)
    })
  } catch (err) {
    console.log("Error while starting the server", err)
    startApp()
  }
}

startApp()
