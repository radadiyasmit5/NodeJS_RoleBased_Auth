const router = require("express").Router()
const userRoute = require("./users")
const testRoute = require("./test")

router.use(userRoute)
router.use(testRoute)


module.exports = router
