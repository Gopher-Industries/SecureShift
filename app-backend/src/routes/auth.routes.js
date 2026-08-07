import express from "express";
import multer from "multer";
import { MongoClient, GridFSBucket } from "mongodb";
import path from "path";
import { upload as imageUpload } from "../config/multer.js"; //
import {
  register,
  registerGuardWithLicense,
  login,
  verifyOTP,
  submitEOI,
} from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new Employer/Admin
 *     description: 
 *       - Employers **must** include an ABN.
 *       - Guards must use `/api/v1/auth/register/guard` because a license image is required.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Test Employer"
 *               email:
 *                 type: string
 *                 example: "new.employer@example.test"
 *               password:
 *                 type: string
 *                 example: "SecureShift1!"
 *               role:
 *                 type: string
 *                 enum: [employer, admin]
 *                 example: employer
 *               phone:
 *                 type: string
 *                 example: "+61400123456"
 *               ABN:
 *                 type: string
 *                 example: "12345678901"
 *                 description: Required if role = employer (must be 11 digits)
 *               address:
 *                 type: object
 *                 properties:
 *                   street: 
 *                     type: string
 *                     example: "123 Main Street"
 *                   suburb: 
 *                     type: string
 *                     example: "Melbourne"
 *                   state: 
 *                     type: string
 *                     example: "VIC"
 *                   postcode: 
 *                     type: string
 *                     example: "3000"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields (e.g., ABN for employers) or email already registered
 */

router.post("/register", register);

/**
 * @swagger
 * /api/v1/auth/register/guard:
 *   post:
 *     summary: Register a new Guard (requires license image)
 *     description: |
 *       A unique email and a single licence image in the **license** form-data field are required.
 *       Supported image types are jpg, png, webp, and heic, with a maximum size of 5MB.
 *       The uploaded image is stored under `/uploads` and the initial licence status is **pending**.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, password, license]
 *             properties:
 *               name: { type: string, example: "Test Guard" }
 *               email: { type: string, format: email, example: "new.guard@example.test" }
 *               password: { type: string, example: "SecureShift1!" }
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
router.post(
  "/register/guard",
  imageUpload.single("license"),
  registerGuardWithLicense,
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Validate credentials and send a one-time passcode
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
 *                 format: email
 *               password:
 *                 type: string
 *           examples:
 *             employer:
 *               summary: Seeded local employer
 *               value:
 *                 email: ops.local@secureshift.test
 *                 password: SecureShift1!
 *             guard:
 *               summary: Seeded local guard
 *               value:
 *                 email: mia.guard@secureshift.test
 *                 password: SecureShift1!
 *     responses:
 *       200:
 *         description: OTP delivered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent to your email
 *       401:
 *         description: Invalid credentials
 *       503:
 *         description: OTP delivery is unavailable; no OTP is returned
 */
router.post("/login", login);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and get JWT token
 *     description: Replace the placeholder OTP with the current code captured by Mailpit at http://localhost:8025.
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
 *                 format: email
 *                 example: ops.local@secureshift.test
 *               otp:
 *                 type: string
 *                 example: "000000"
 *                 description: Placeholder only. Use the current OTP from Mailpit at http://localhost:8025.
 *     responses:
 *       200:
 *         description: JWT token issued
 *       401:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", verifyOTP);

// ---------------- EOI Upload Config using MemoryStorage ----------------
const storage = multer.memoryStorage(); // store files in memory temporarily
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

// ---------------- MongoDB GridFS Setup ----------------
const mongoUri = process.env.MONGO_URI; // e.g., mongodb://localhost:27017/secureShift
let gridFSBucket;

if (process.env.NODE_ENV !== "test") {
  MongoClient.connect(mongoUri)
    .then((client) => {
      const db = client.db(); // default DB from URI
      gridFSBucket = new GridFSBucket(db, { bucketName: "eoiDocuments" });
      console.log("Connected to MongoDB GridFS for EOI uploads");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
}
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
router.post("/eoi", upload.array("documents", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No documents uploaded" });
    }

    // store each file in GridFS
    const fileInfos = await Promise.all(
      req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = gridFSBucket.openUploadStream(
            file.originalname,
            {
              contentType: file.mimetype, // use actual mimetype
            },
          );

          uploadStream.end(file.buffer);
          uploadStream.on("finish", () => {
            resolve({
              filename: uploadStream.filename,
              id: uploadStream.id,
            });
          });
          uploadStream.on("error", reject);
        });
      }),
    );

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
    const { employerCreated } = await submitEOI(eoiData);

    let message = "EOI submitted successfully";
    if (!employerCreated) {
      message +=
        " (Account already exists for this email; no new credentials sent)";
    }

    res.status(201).json({ message, files: fileInfos });
  } catch (err) {
    console.error("EOI upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
