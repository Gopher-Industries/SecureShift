import {
    getAllDocuments,
    getDocumentById,
    updateDocumentExpiry,
    createDocument
} from "../services/document.service.js";

/**
 * Create a new document (secure: userId comes from req.user)
 */
export const addDocument = async (req, res) => {
    try {
        const result = await createDocument(
            {
                ...req.body,
                userId: req.user._id // enforce backend-controlled identity
            },
            req.user
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
            req.user
        );

        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};