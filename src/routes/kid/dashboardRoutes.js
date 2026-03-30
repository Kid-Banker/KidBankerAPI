const express = require("express");
const router = express.Router();

const controller = require("../../controllers/kid/dashboardController");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

router.use(authMiddleware, roleMiddleware(["KID"]));

// endpoint modular
router.get("/profile", controller.getProfileInfo);
router.get("/my-savings", controller.getMySavings);
router.get("/weekly-report", controller.getWeeklyReport);
router.get("/weekly-transactions", controller.getWeeklyTransactions);
router.get("/monthly-overview", controller.getMonthlyOverview);
router.get("/paylater-overview", controller.getPaylaterOverview);
router.get("/last-transactions", controller.getLastTransactions);

module.exports = router;
