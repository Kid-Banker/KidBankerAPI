const transactionService = require("../services/transactionService");

const handleError = (res, error) => {
  console.error(error);
  return res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
  });
};

// create transaction controller
exports.createTransaction = async (req, res) => {
  try {
    const data = await transactionService.createTransaction(
      req.user.id,
      req.body,
    );
    res.json({
      message: "Transaction created successfully",
      data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// get transactions controller
exports.getTransactions = async (req, res) => {
  try {
    const data = await transactionService.getTransactions(
      req.user.id,
      req.user.role,
    );
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};
