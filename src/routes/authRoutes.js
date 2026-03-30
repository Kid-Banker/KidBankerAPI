const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// router.get("/google", (req, res) => {
//   res.json({
//     message: "Google Authentication",
//   });
// });

router.post("/google", authController.googleLogin);
router.post("/register", authController.register);
router.post(
  "/link-parent",
  authMiddleware,
  roleMiddleware(["KID"]),
  authController.linkParent,
);

module.exports = router;
