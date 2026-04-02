const express = require("express");
const router = express.Router();

const financeRoutes = require("./financeRoutes");
const paylaterRoutes = require("./paylaterRoutes");
const kidDashboardRoutes = require("./kid/dashboardRoutes");
const parentDashboardRoutes = require("./parent/dashboardRoutes");

router.use("/finance", financeRoutes);
router.use("/paylater", paylaterRoutes);
router.use("/kid", kidDashboardRoutes);
router.use("/parent", parentDashboardRoutes);

module.exports = router;
