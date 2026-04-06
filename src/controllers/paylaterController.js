const paylaterService = require("../services/paylaterService");

const handleError = (res, error) => {
  console.error(error);
  return res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
  });
};

// create request paylater controller
exports.requestPaylater = async (req, res) => {
  try {
    const data = await paylaterService.requestPaylater(req.user.id, req.body);
    res.json({
      message: "Paylater request created",
      data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// get list of requests paylater controller
exports.getRequests = async (req, res) => {
  try {
    const data = await paylaterService.getRequests(req.user.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

// approve paylater request controller
exports.approvePaylater = async (req, res) => {
  try {
    const data = await paylaterService.approvePaylater(
      req.user.id,
      req.params.id,
    );
    res.json({
      message: "Paylater request approved & added to Google Calendar",
      data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// reject paylater request controller
exports.rejectPaylater = async (req, res) => {
  try {
    const data = await paylaterService.rejectPaylater(
      req.user.id,
      req.params.id,
    );
    res.json({
      message: "Paylater request rejected",
      data,
    });
  } catch (error) {
    handleError(res, error);
  }
};
