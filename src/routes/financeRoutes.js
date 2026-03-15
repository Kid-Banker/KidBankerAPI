const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddeware = require("../middlewares/roleMiddleware");

const savingController = require("../controllers/savingsController");
const transactionController = require("../controllers/transactionController");

router.get("/savings", authMiddleware, savingController.getSavings);
router.get(
  "/transactions",
  authMiddleware,
  transactionController.getTransactions,
);
router.post(
  "/transactions",
  authMiddleware,
  transactionController.createTransaction,
);

module.exports = router;
