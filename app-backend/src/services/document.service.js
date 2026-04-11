import User from "../models/User.js";
// CREATE DOCUMENT
export const createDocument = async (data, user) => {
    const { userId, type, expiryDate, imageUrl } = data;

    if (!userId || !type) {
        throw new Error("userId and type are required");
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new Error("User not found");
    }

    // RBAC: only admin or employer
    if (user.role !== "admin" && user.role !== "employer") {
        throw new Error("Not authorized to create document");
    }

    const newDoc = {
        type,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        imageUrl,
        verificationStatus: "pending",
        expiryStatus: calculateExpiryStatus(expiryDate)
    };

    targetUser.documents.push(newDoc);

    await targetUser.save();

    return {
        message: "Document created successfully",
        document: newDoc
    };
};
// Calculate expiry status
export const calculateExpiryStatus = (expiryDate) => {
    if (!expiryDate) return "valid";

    const now = new Date();
    const expiry = new Date(expiryDate);

    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return "expired";
    if (diffDays <= 30) return "expiring";
    return "valid";
};

//  Get all documents with filters
export const getAllDocuments = async (query) => {
    const { status, type } = query;

    const users = await User.find({ "documents.0": { $exists: true } });

    let results = [];

    users.forEach(user => {
        user.documents.forEach(doc => {

            const expiryStatus = calculateExpiryStatus(doc.expiryDate);

            // filter
            if (status && expiryStatus !== status) return;
            if (type && doc.type !== type) return;

            results.push({
                userId: user._id,
                name: user.name,
                documentId: doc._id,
                type: doc.type,
                expiryDate: doc.expiryDate,
                expiryStatus,
                verificationStatus: doc.verificationStatus,
                imageUrl: doc.imageUrl
            });
        });
    });

    return results;
};

//  Get single document
export const getDocumentById = async (docId) => {
    const user = await User.findOne({ "documents._id": docId });

    if (!user) throw new Error("Document not found");

    const doc = user.documents.id(docId);

    return {
        userId: user._id,
        name: user.name,
        documentId: doc._id,
        type: doc.type,
        expiryDate: doc.expiryDate,
        expiryStatus: calculateExpiryStatus(doc.expiryDate),
        verificationStatus: doc.verificationStatus,
        imageUrl: doc.imageUrl
    };
};

//  Update expiry date
export const updateDocumentExpiry = async (docId, expiryDate, user) => {

    if (!expiryDate) throw new Error("expiryDate is required");

    const newDate = new Date(expiryDate);
    if (isNaN(newDate.getTime())) {
        throw new Error("Invalid expiry date");
    }

    const targetUser = await User.findOne({ "documents._id": docId });

    if (!targetUser) throw new Error("Document not found");

    const doc = targetUser.documents.id(docId);

    //  RBAC: only admin OR owner
    if (
        user.role !== "admin" &&
        String(targetUser._id) !== String(user._id)
    ) {
        throw new Error("Not authorized to update this document");
    }

    doc.expiryDate = newDate;
    doc.expiryStatus = calculateExpiryStatus(newDate);

    await targetUser.save();

    return { message: "Document expiry updated successfully" };
};