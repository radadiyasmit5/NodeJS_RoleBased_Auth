import cors from "cors";
import { consola, createConsola } from "consola";
import express from "express";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import { default as connectMongoDBSession } from "connect-mongodb-session";
import {initiatePassportMiddleware} from "./passport/passport.local.strategy.js";
const app = express();
import { APP_DB, PORT, APP_EXPRESS_SESSION_SECRET } from "./config/index.js";
import routes from "./routes/index.routes.js";
import connectDB from "./db/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const MongoDBStore = connectMongoDBSession(session);
// mongo db connection for express-session
var store = new MongoDBStore({
  uri: APP_DB,
  collection: "express-session",
});
// middlewares
app.use(
  cors({
    origin: "*",
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: APP_EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { maxAge: 1000 * 60 * 60 },
  })
);

initiatePassportMiddleware();

app.use(passport.initialize());
app.use(passport.session());
app.use(routes);
//start app
const startApp = async () => {
  try {
    //connect Db
    await connectDB();

    consola.success({
      message: `Successfully connected with the Database`,
      badge: true,
    });

    app.listen(PORT, () => {
      console.log("server started on port", PORT);
    });
  } catch (err) {
    console.log("Error while starting the server", err);
    startApp();
  }
};
app.use(errorMiddleware);
startApp();
