const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const savingController = require("../controllers/savingsController");
const transactionController = require("../controllers/transactionController");

router.get(
  "/savings",
  authMiddleware,
  roleMiddleware(["KID", "PARENT"]),
  savingController.getSavings,
);
router.get(
  "/transactions",
  authMiddleware,
  roleMiddleware(["KID", "PARENT"]),
  transactionController.getTransactions,
);
router.post(
  "/transactions",
  authMiddleware,
  roleMiddleware(["KID"]),
  transactionController.createTransaction,
);

module.exports = router;
