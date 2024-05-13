const router = require("express").Router()
const { TestController } = require("../controllers/testController");
const { TEST_ROUTES } = require("../utils/constants");

router.get(TEST_ROUTES.TEST, TestController)

module.exports = router;