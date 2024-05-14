const router = require("express").Router()
const userRoute = require("./users")

router.use(userRoute)


module.exports = router
