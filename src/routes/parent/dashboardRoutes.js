const express = require("express");
const router = express.Router();

const controller = require("../../controllers/parent/dashboardController");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

router.use(authMiddleware, roleMiddleware(["PARENT"]));

// endpoint modular
router.get("/profile", controller.getProfileInfo);
router.get("/kid-savings", controller.getKidSavings);
router.get("/weekly-report", controller.getWeeklyReport);
router.get("/monthly-report", controller.getMonthlyReport);
router.get("/weekly-transactions", controller.getWeeklyTransactions);
router.get("/monthly-overview", controller.getMonthlyOverview);
router.get("/transactions", controller.getTransactions);
router.get("/last-transactions", controller.getLastTransactions);
router.get("/paylater-overview", controller.getPaylaterOverview);
router.get("/paylater-pending", controller.getPendingPaylater);
router.get("/paylater-reminder", controller.getPaylaterReminder);
router.get("/paylater-status", controller.getPaylaterStatus);

module.exports = router;
