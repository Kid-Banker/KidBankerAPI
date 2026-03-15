const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const financeRoutes = require("./routes/financeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "KidBanker API is running",
  });
});

// public routes
app.use("/auth", authRoutes);

// protected routes
app.use("/api", financeRoutes)

module.exports = app;
