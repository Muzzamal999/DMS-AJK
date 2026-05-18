import express from "express";
import Application from "../models/Application.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/public/stats - Public statistics for landing page
router.get("/stats", async (req, res) => {
  try {
    const certificatesIssued = await Application.countDocuments({ status: "approved" });
    const registeredCitizens = await User.countDocuments({ role: "citizen" });
    const pendingApplications = await Application.countDocuments({ status: "pending" });
    const totalApplications = await Application.countDocuments();

    // Calculate average processing time (in days) for approved applications
    const approvedApps = await Application.find({
      status: "approved",
      issuedAt: { $exists: true }
    }).select("createdAt issuedAt");

    let avgProcessingDays = "3-5";
    if (approvedApps.length > 0) {
      const totalMs = approvedApps.reduce((sum, app) => {
        return sum + (new Date(app.issuedAt) - new Date(app.createdAt));
      }, 0);
      const avgMs = totalMs / approvedApps.length;
      const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
      avgProcessingDays = avgDays.toString();
    }

    res.status(200).json({
      success: true,
      stats: {
        certificatesIssued,
        registeredCitizens,
        pendingApplications,
        totalApplications,
        avgProcessingDays,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

export default router;