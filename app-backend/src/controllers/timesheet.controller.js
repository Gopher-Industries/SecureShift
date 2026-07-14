import {
  generateTimesheets,
  getTimesheetForUser,
  listTimesheetsForUser,
} from '../services/timesheet.service.js';

const sendError = (res, error, fallbackMessage) =>
  res.status(error.statusCode || 500).json({
    message: error.message || fallbackMessage,
  });

export const generateTimesheetsForRange = async (req, res) => {
  try {
    const result = await generateTimesheets(req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 'Failed to generate timesheets');
  }
};

export const listTimesheets = async (req, res) => {
  try {
    const result = await listTimesheetsForUser(req.query, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 'Failed to retrieve timesheets');
  }
};

export const getTimesheetById = async (req, res) => {
  try {
    const result = await getTimesheetForUser(req.params.id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 'Failed to retrieve timesheet');
  }
};
