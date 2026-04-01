const dashboardService = require("../../services/kid/dashboardService");

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

// get my savings
exports.getMySavings = async (req, res) => {
  try {
    const data = await dashboardService.getMySavings(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get weekly income
exports.getWeeklyIncome = async (req, res) => {
  try {
    const data = await dashboardService.getWeeklyIncome(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// get weekly expense
exports.getWeeklyExpense = async (req, res) => {
  try {
    const data = await dashboardService.getWeeklyExpense(req.user.id);
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

// get tranasactions data with pagination
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

// get paylater data overview
exports.getPaylaterOverview = async (req, res) => {
  try {
    const data = await dashboardService.getPaylaterOverview(req.user.id);
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
}

// aggregate data for dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      profile,
      summary,
      weekly,
      weeklyTransactions,
      monthly,
      paylater,
      lastTransactions,
    ] = await Promise.all([
      dashboardService.getProfile(userId),
      dashboardService.getSummary(userId),
      dashboardService.getWeeklyReport(userId),
      dashboardService.getWeeklyTransactions(userId),
      dashboardService.getMonthlyOverview(userId),
      dashboardService.getPaylater(userId),
      dashboardService.getLastTransactions(userId),
    ]);

    res.json({
      profile,
      summary,
      weekly,
      weeklyTransactions,
      monthly,
      paylater,
      lastTransactions,
    });
  } catch (error) {
    handleError(res, error);
  }
};
