const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const paylaterController = require("../controllers/paylaterController");

router.post("/request", authMiddleware, paylaterController.requestPaylater);
router.get("/requests", authMiddleware, paylaterController.getRequests);
router.patch(
  "/approve/:id",
  authMiddleware,
  paylaterController.approvePaylater,
);
router.patch("/reject/:id", authMiddleware, paylaterController.rejectPaylater);

module.exports = router;
