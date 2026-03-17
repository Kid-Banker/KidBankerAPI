const express = require("express");
const router = express.Router();

const financeRoutes = require("./financeRoutes");
const paylaterRoutes = require("./paylaterRoutes");

router.use("/finance", financeRoutes);
router.use("/paylater", paylaterRoutes);

module.exports = router