const express = require("express");
const router = express.Router();

const financeRoutes = require("./financeRoutes");
const paylaterRoutes = require("./paylaterRoutes");
const kidDashboardRoutes = require("./kid/dashboardRoutes");

router.use("/finance", financeRoutes);
router.use("/paylater", paylaterRoutes);
router.use("/", kidDashboardRoutes);

module.exports = router