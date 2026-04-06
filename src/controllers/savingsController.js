const savingsService = require("../services/savingsService");

const handleError = (res, error) => {
  console.error(error);
  return res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
  });
};

// get savings controller
exports.getSavings = async (req, res) => {
  try {
    const data = await savingsService.getSavings(req.user.id, req.user.role);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};
