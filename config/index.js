require("dotenv").config()

module.exports = {
  SECRET: process.env.APP_SECRET,
  APP_DB: process.env.APP_DB,
  PORT: process.env.PORT,
}
