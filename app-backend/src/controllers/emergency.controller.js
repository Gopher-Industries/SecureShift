import {
  cancelSOSForUser,
  createSOS,
  EmergencyServiceError,
  getActiveSOSForUser,
  getSOSById,
  listSOS,
  serializeSOS,
  transitionSOS,
  updateSOSLocationForUser,
  updateSOSNoteForUser,
} from "../services/emergency.service.js";

const sendSOS = (res, statusCode, message, sos) => {
  res.status(statusCode).json({
    message,
    data: sos,
    sos: serializeSOS(sos),
  });
};

const handleError = (res, error) => {
  if (error instanceof EmergencyServiceError) {
    const response = { message: error.message };
    if (error.details?.sos) {
      response.data = error.details.sos;
      response.sos = serializeSOS(error.details.sos);
    }
    return res.status(error.statusCode).json(response);
  }

  console.error("Emergency controller error:", error);
  return res.status(500).json({ message: "Internal server error" });
};

export const triggerSOS = async (req, res) => {
  try {
    const sos = await createSOS(req.user, req.body);
    return sendSOS(res, 201, "SOS triggered successfully", sos);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getSOSHistory = async (req, res) => {
  try {
    const data = await listSOS(req.user);
    return res.status(200).json({
      count: data.length,
      data,
      sos: data.map(serializeSOS),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getActiveSOS = async (req, res) => {
  try {
    const sos = await getActiveSOSForUser(req.user);
    return res.status(200).json({ data: sos, sos: serializeSOS(sos) });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getSOSStatus = async (req, res) => {
  try {
    const sos = await getSOSById(req.user, req.params.id);
    return res.status(200).json({ data: sos, sos: serializeSOS(sos) });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateSOSStatus = async (req, res) => {
  try {
    const sos = await transitionSOS(req.user, req.params.id, req.body.status, req.body.message);
    return sendSOS(res, 200, "Status updated", sos);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateSOSLocation = async (req, res) => {
  try {
    const sos = await updateSOSLocationForUser(req.user, req.params.id, req.body);
    return sendSOS(res, 200, "SOS location updated", sos);
  } catch (error) {
    return handleError(res, error);
  }
};

export const addSOSNote = async (req, res) => {
  try {
    const sos = await updateSOSNoteForUser(req.user, req.params.id, req.body.note);
    return sendSOS(res, 200, "SOS note updated", sos);
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelSOS = async (req, res) => {
  try {
    const sos = await cancelSOSForUser(req.user, req.params.id);
    return sendSOS(res, 200, "SOS cancelled", sos);
  } catch (error) {
    return handleError(res, error);
  }
};
