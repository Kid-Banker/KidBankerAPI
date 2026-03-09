const express = require("express");
const router = express.Router();

router.get("/google", (req, res) => {
    res.json({
        message: "Google Authentication",
    });
})

module.exports = router;