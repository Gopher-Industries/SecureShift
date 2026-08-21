import {
  createShiftRequest as createShiftRequestService,
  getShiftRequestForUser,
  listShiftRequestsForUser,
  reviewShiftRequest,
} from "../services/shiftrequest.service.js";

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  return res
    .status(statusCode)
    .json({ message: error.message || "Shift request operation failed" });
};

export const createShiftRequest = async (req, res) => {
  try {
    const shiftRequest = await createShiftRequestService({
      user: req.user,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      data: shiftRequest,
      message: "Shift request created",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getShiftRequests = async (req, res) => {
  try {
    const result = await listShiftRequestsForUser({
      user: req.user,
      query: req.query,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getShiftRequestById = async (req, res) => {
  try {
    const shiftRequest = await getShiftRequestForUser({
      user: req.user,
      requestId: req.params.id,
    });

    return res.json({
      success: true,
      data: shiftRequest,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateShiftRequest = async (req, res) => {
  try {
    const shiftRequest = await reviewShiftRequest({
      user: req.user,
      requestId: req.params.id,
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
    });

    return res.json({
      success: true,
      data: shiftRequest,
      message: `Shift request ${shiftRequest.status.toLowerCase()}`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
