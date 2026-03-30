const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const paylaterController = require("../controllers/paylaterController");

router.post(
  "/request",
  authMiddleware,
  roleMiddleware(["KID"]),
  paylaterController.requestPaylater,
);
router.get(
  "/requests",
  authMiddleware,
  roleMiddleware(["PARENT"]),
  paylaterController.getRequests,
);
router.patch(
  "/approve/:id",
  authMiddleware,
  roleMiddleware(["PARENT"]),
  paylaterController.approvePaylater,
);
router.patch(
  "/reject/:id",
  authMiddleware,
  roleMiddleware(["PARENT"]),
  paylaterController.rejectPaylater,
);

module.exports = router;
