const express = require("express");
const router = express.Router();

const controller = require("../../controllers/kid/dashboardController");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

router.use(authMiddleware, roleMiddleware(["KID"]));

// endpoint modular
router.get("/profile", controller.getProfileInfo);
router.get("/my-savings", controller.getMySavings);
router.get("/weekly-income", controller.getWeeklyIncome);
router.get("/weekly-expense", controller.getWeeklyExpense);
router.get("/weekly-report", controller.getWeeklyReport);
router.get("/weekly-transactions", controller.getWeeklyTransactions);
router.get("/monthly-overview", controller.getMonthlyOverview);
router.get("/transactions", controller.getTransactions);
router.get("/last-transactions", controller.getLastTransactions);
router.get("/paylater-overview", controller.getPaylaterOverview);
router.get("/paylater-reminder", controller.getPaylaterReminder);
router.get("/paylater-status", controller.getPaylaterStatus);

module.exports = router;
