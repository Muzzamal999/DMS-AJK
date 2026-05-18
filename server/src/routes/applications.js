import express from "express";
import {
  createApplication,
  saveDraft,
  getApplications,
  getApplication,
  updateApplicationStatus,
  uploadDocuments,
  verifyCertificate,
  getDashboardSummary,
  downloadCertificate,
  trackApplicationStatus,
} from "../controllers/applicationController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { uploadDocuments as uploadMiddleware } from "../middlewares/upload.js";

const router = express.Router();

// Public — certificate verification
router.get("/verify/:certificateNumber", verifyCertificate);

// Protected routes
router.use(protect);

// Citizen dashboard
router.get("/dashboard", restrictTo("citizen"), getDashboardSummary);

// CRUD
router.get("/", getApplications);
router.post("/", uploadMiddleware, createApplication);
router.put("/draft", uploadMiddleware, saveDraft);
router.post("/:id/track", trackApplicationStatus);
router.get("/:id", getApplication);
router.patch("/:id/status", restrictTo("clerk", "admin"), updateApplicationStatus);
router.post("/:id/documents", uploadMiddleware, uploadDocuments);

// Certificate PDF download
router.get("/:id/certificate", downloadCertificate);

export default router;
