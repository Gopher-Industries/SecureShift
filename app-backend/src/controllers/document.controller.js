import {
  getAllDocuments,
  getDocumentById,
  updateDocumentExpiry,
  createDocument,
  getDocumentFileForUser,
} from "../services/document.service.js";

/**
 * Create a new document (secure: userId comes from req.user)
 */
export const addDocument = async (req, res) => {
  try {
    const result = await createDocument(
      {
        ...req.body,
        userId: req.user._id, // enforce backend-controlled identity
      },
      req.user,
    );

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Get all documents with filters (admin/employer)
 */
export const getDocuments = async (req, res) => {
  try {
    const data = await getAllDocuments(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Get single document by ID
 */
export const getSingleDocument = async (req, res) => {
  try {
    const data = await getDocumentById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/**
 * Update document expiry date (RBAC enforced in service)
 */
export const updateDocument = async (req, res) => {
  try {
    const result = await updateDocumentExpiry(
      req.params.id,
      req.body.expiryDate,
      req.user,
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/v1/documents/:id/file
 *
 * Send the file behind a document record. All rules live in the service, so
 * this only turns the result into a response.
 */
export const downloadDocumentFile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const file = await getDocumentFileForUser(req.params.id, req.user);
    return res.download(file.path, file.filename);
  } catch (err) {
    if (err?.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("Document file download error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
