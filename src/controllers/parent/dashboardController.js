const dashboardService = require("../../services/parent/dashboardService");

const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    message: error.message || "Internal server error",
  });
};

// get profile info
exports.getProfileInfo = async (req, res) => {
  try {
    const data = await dashboardService.getProfileInfo(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get kid savings
exports.getKidSavings = async (req, res) => {
  try {
    const data = await dashboardService.getKidSavings(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get weekly report
exports.getWeeklyReport = async (req, res) => {
  try {
    const data = await dashboardService.getWeeklyReport(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get monthly report
exports.getMonthlyReport = async (req, res) => {
  try {
    const data = await dashboardService.getMonthlyReport(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get weekly transactions
exports.getWeeklyTransactions = async (req, res) => {
  try {
    const data = await dashboardService.getWeeklyTransactions(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get monthly overview
exports.getMonthlyOverview = async (req, res) => {
  try {
    const data = await dashboardService.getMonthlyOverview(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get transactions with pagination
exports.getTransactions = async (req, res) => {
  try {
    const data = await dashboardService.getTransactions(
      req.user.id,
      req.query.page,
      req.query.limit,
    );
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get last 5 transactions
exports.getLastTransactions = async (req, res) => {
  try {
    const data = await dashboardService.getLastTransactions(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get paylater overview
exports.getPaylaterOverview = async (req, res) => {
  try {
    const data = await dashboardService.getPaylaterOverview(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get pending paylater
exports.getPendingPaylater = async (req, res) => {
  try {
    const data = await dashboardService.getPendingPaylater(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get paylater reminder
exports.getPaylaterReminder = async (req, res) => {
  try {
    const data = await dashboardService.getPaylaterReminder(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get paylater status
exports.getPaylaterStatus = async (req, res) => {
  try {
    const data = await dashboardService.getPaylaterStatus(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};
