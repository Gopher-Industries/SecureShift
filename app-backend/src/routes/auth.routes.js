import express from 'express';
import multer from 'multer';
import { MongoClient, GridFSBucket } from 'mongodb';
import path from 'path';
import { upload as imageUpload } from '../config/multer.js'; //
import { register, registerGuardWithLicense, login, verifyOTP, submitEOI } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new Employer/Admin
 *     description: Guards must use /api/v1/auth/register/guard** because a license image is required.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string, example: "Krish Uppal" }
 *               email: { type: string, example: "krish@example.com" }
 *               password: { type: string, example: "P@ssw0rd!" }
 *               role:
 *                 type: string
 *                 enum: [employer, admin]
 *                 example: employer
 *               phone: { type: string, example: "+61400123456" }
 *               address:
 *                 type: object
 *                 properties:
 *                   street: { type: string, example: "123 Main Street" }
 *                   suburb: { type: string, example: "Melbourne" }
 *                   state: { type: string, example: "VIC" }
 *                   postcode: { type: string, example: "3000" }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already registered or guard role not allowed here
 */
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/register/guard:
 *   post:
 *     summary: Register a new Guard (requires license image)
 *     description: |
 *       Accepts a single image file in **license** form-data field (jpg, png, webp, heic), max 5MB.
 *       The uploaded image is stored under /uploads** and the guard's license status is set to **pending**.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, password, license]
 *             properties:
 *               name: { type: string, example: "John Guard" }
 *               email: { type: string, format: email, example: "john.guard@example.com" }
 *               password: { type: string, example: "P@ssw0rd!" }
 *               license:
 *                 type: string
 *                 format: binary
 *                 description: License image file (jpg, png, webp, heic), max 5MB
 *     responses:
 *       201:
 *         description: Guard registered; license uploaded (status = pending)
 *       400:
 *         description: Missing required fields or license image
 *       500:
 *         description: Server error
 */
router.post('/register/guard', imageUpload.single('license'), registerGuardWithLicense);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and retrieve a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: krish@example.com
 *               password:
 *                 type: string
 *                 example: P@ssw0rd!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *                 role:
 *                   type: string
 *                   example: guard
 *                 id:
 *                   type: string
 *                   example: 64d9fa5b5e18f9b9a3d52f77
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token issued
 *       401:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', verifyOTP);

// ---------------- EOI Upload Config using MemoryStorage ----------------
const storage = multer.memoryStorage(); // store files in memory temporarily
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
});

// ---------------- MongoDB GridFS Setup ----------------
const mongoUri = process.env.MONGO_URI; // e.g., mongodb://localhost:27017/secureShift
let dbClient;
let gridFSBucket;

MongoClient.connect(mongoUri)
  .then(client => {
    dbClient = client;
    const db = client.db(); // default DB from URI
    gridFSBucket = new GridFSBucket(db, { bucketName: 'eoiDocuments' });
    console.log('Connected to MongoDB GridFS for EOI uploads');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
/**
 * @swagger
 * /api/v1/auth/eoi:
 *   post:
 *     summary: Submit an Expression of Interest (EOI) with PDF documents
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [companyName, abnAcn, contactPerson, contactEmail, phone, description, documents]
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: SecureShift Pty Ltd
 *               abnAcn:
 *                 type: string
 *                 example: 12345678901
 *               contactPerson:
 *                 type: string
 *                 example: John Doe
 *               contactEmail:
 *                 type: string
 *                 example: johndoe@example.com
 *               phone:
 *                 type: string
 *                 example: "+61400123456"
 *               description:
 *                 type: string
 *                 example: Security company providing professional guard services
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 PDF files
 *     responses:
 *       201:
 *         description: EOI submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: EOI submitted successfully
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         example: company-profile.pdf
 *                       id:
 *                         type: string
 *                         example: 64f1c6a3b5e18f9b9a3d52f77
 *       400:
 *         description: No documents uploaded
 *       500:
 *         description: Server error while uploading EOI
 */

// ---------------- EOI Route ----------------
router.post('/eoi', upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    // store each file in GridFS
const fileInfos = await Promise.all(req.files.map(file => {
  return new Promise((resolve, reject) => {
    const uploadStream = gridFSBucket.openUploadStream(file.originalname, {
      contentType: file.mimetype, // use actual mimetype
    });

    uploadStream.end(file.buffer);
    uploadStream.on('finish', () => {
      resolve({
        filename: uploadStream.filename,
        id: uploadStream.id,
      });
    });
    uploadStream.on('error', reject);
  });
}));


    // You can also save other EOI info in MongoDB collection
    const eoiData = {
      companyName: req.body.companyName,
      abnAcn: req.body.abnAcn,
      contactPerson: req.body.contactPerson,
      contactEmail: req.body.contactEmail,
      phone: req.body.phone,
      description: req.body.description,
      documents: fileInfos,
      createdAt: new Date(),
    };

    // Use your submitEOI controller to store eoiData in a collection
    const { eoi, employerCreated } = await submitEOI(eoiData);

    let message = 'EOI submitted successfully';
    if (!employerCreated) {
      message += ' (Account already exists for this email; no new credentials sent)';
    }

    res.status(201).json({ message, files: fileInfos });
  } catch (err) {
    console.error('EOI upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;