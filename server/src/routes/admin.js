import express from "express";
import multer from "multer";
import {
  getDashboardStats,
  getRecentAudits,
  getApplicationStatus,
  getAdminApplications,
  approveApplication,
  rejectApplication,
  getDocumentWallet,
  getStatusTracker,
  getSupportClerks,
  getPrivacyPolicy,
  updatePrivacyPolicy,
  getProfile,
  updateProfile,
  saveProfileAvatar,
  getUsers,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

router.use(protect);

router.get("/stats", restrictTo("admin", "clerk"), getDashboardStats);
router.get("/dashboard-stats", restrictTo("admin"), getDashboardStats);
router.get("/recent-audits", restrictTo("admin"), getRecentAudits);
router.get("/application-status", restrictTo("admin"), getApplicationStatus);
router.get("/applications", restrictTo("admin"), getAdminApplications);
router.post("/application/:id/approve", restrictTo("admin"), approveApplication);
router.post("/application/:id/reject", restrictTo("admin"), rejectApplication);
router.get("/document-wallet/:citizenId", restrictTo("admin"), getDocumentWallet);
router.get("/status-tracker", restrictTo("admin"), getStatusTracker);
router.get("/support-clerks", restrictTo("admin"), getSupportClerks);
router.get("/privacy-policy", restrictTo("admin"), getPrivacyPolicy);
router.post("/privacy-policy", restrictTo("admin"), updatePrivacyPolicy);
router.get("/profile", restrictTo("admin"), getProfile);
router.patch("/profile/update", restrictTo("admin"), updateProfile);
router.post("/profile/avatar", restrictTo("admin"), upload.single("avatar"), saveProfileAvatar);
router.get("/users", restrictTo("admin"), getUsers);

export default router;