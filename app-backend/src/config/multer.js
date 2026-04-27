// config/multer.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// where & how to store files
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const safeOriginal = file.originalname.replace(/[^\w.-]/g, '_');
        const ts = Date.now();
        cb(null, `${ts}-${safeOriginal}`);
    },
});

// accept images only + 5MB limit
const fileFilter = (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/heic','application/pdf'  ].includes(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const incidentAttachmentFilter = (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, and PDF files are allowed'), ok);
};

export const incidentAttachmentUpload = multer({
    storage: multer.memoryStorage(), // Use memory storage to keep files in buffer for MongoDB
    fileFilter: incidentAttachmentFilter,
    limits: {fileSize: 5 * 1024 * 1024},
});
