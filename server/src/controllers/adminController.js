import Application from "../models/Application.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import Setting from "../models/Setting.js";
import StatusTrackingLog from "../models/StatusTrackingLog.js";
import { broadcastRealtime } from "../utils/realtime.js";

const formatAudit = (log) => ({
  id: log._id?.toString() || null,
  user: log.user || "",
  userInitials: log.userInitials || "",
  action: log.action || "",
  resource: log.resource || "",
  timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : "",
  status: log.status || "pending",
});

const logAdminAction = async (req, action, context = "admin_panel", metadata = {}) => {
  try {
    await AdminActivityLog.create({
      adminId: req.user._id,
      action,
      context,
      metadata,
    });
  } catch (error) {
    console.warn("Failed to create admin activity log:", error.message);
  }
};

const requiredDocumentLabels = [
  "CNIC Copy (Front)",
  "CNIC Copy (Back)",
  "Passport Size Photograph",
  "Proof of Residence",
];

const getDocumentStatus = (documents) => {
  const availableLabels = new Set(documents.map((doc) => doc.label));
  return requiredDocumentLabels.map((label) => ({
    label,
    present: availableLabels.has(label),
  }));
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const total = await Application.countDocuments();
    const pending = await Application.countDocuments({ status: "pending" });
    const verified = await Application.countDocuments({ status: "verified" });
    const approved = await Application.countDocuments({ status: "approved" });
    const rejected = await Application.countDocuments({ status: "rejected" });
    const inReview = await Application.countDocuments({ status: "in_review" });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const volumeRaw = await Application.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const volumeData = days.map((day, i) => {
      const found = volumeRaw.find((v) => v._id === i + 1);
      return { day, domestic: found ? found.count : 0, overseas: 0 };
    });

    const districtRaw = await Application.aggregate([
      { $group: { _id: "$district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const colors = ["#0d4f3c", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
    const districtData = districtRaw.map((d, i) => ({
      district: d._id,
      count: d.count,
      color: colors[i] || "#888",
    }));

    const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(10);
    const formattedLogs = auditLogs.map(formatAudit);

    res.status(200).json({
      success: true,
      stats: {
        totalApplications: total,
        pendingVerification: pending,
        approvedCertificates: approved,
        rejectedFraudAlerts: rejected,
        systemHealth: {
          cpuLoad: Math.floor(Math.random() * 40 + 20),
          memoryUsed: 4.2,
          memoryTotal: 8,
          apiResponseMs: Math.floor(Math.random() * 50 + 60),
          status: "Operational",
        },
      },
      volumeData,
      districtData,
      auditLogs: formattedLogs,
      applicationStatus: {
        pending,
        verified,
        inReview,
        approved,
        rejected,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentAudits = async (req, res, next) => {
  try {
    const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ success: true, auditLogs: auditLogs.map(formatAudit) });
  } catch (error) {
    next(error);
  }
};

export const getApplicationStatus = async (req, res, next) => {
  try {
    const statusCounts = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusMap = statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});

    const total = await Application.countDocuments();
    const completion = total
      ? Math.round(((statusMap.approved || 0) / total) * 100)
      : 0;

    res.status(200).json({
      success: true,
      statusSummary: {
        pending: statusMap.pending || 0,
        verified: statusMap.verified || 0,
        inReview: statusMap.in_review || 0,
        approved: statusMap.approved || 0,
        rejected: statusMap.rejected || 0,
        completion,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminApplications = async (req, res, next) => {
  try {
    const query = {};
    const { status, district, search, forwarded, page = 1, limit = 20 } = req.query;

    if (status && status !== "all") query.status = status;
    if (district && district !== "all") query.district = district;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { cnic: { $regex: search, $options: "i" } },
        { applicationId: { $regex: search, $options: "i" } },
      ];
    }
    if (forwarded === "true") {
      query.reviewedBy = { $exists: true, $ne: null };
    }

    const total = await Application.countDocuments(query);
    const apps = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("userId", "name email district");

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      applications: apps.map((app) => ({
        id: app._id?.toString() || null,
        applicationId: app.applicationId || "",
        userId: app.userId?._id ? app.userId._id.toString() : app.userId?.toString() || null,
        fullName: app.fullName || "",
        cnic: app.cnic || "",
        district: app.district || "",
        status: app.status || "pending",
        remarks: app.remarks || null,
        documents: app.documents || [],
        submittedAt: app.createdAt || null,
        updatedAt: app.updatedAt || null,
        reviewedBy: app.reviewedBy || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const approveApplication = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    app.status = "approved";
    app.remarks = req.body.remarks || app.remarks;
    app.reviewedBy = req.user._id;
    app.certificateNumber = app.certificateNumber || `AJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    app.issuedAt = new Date();

    await app.save();

    await Notification.create({
      userId: app.userId,
      title: "Application Approved",
      message: `Your application ${app.applicationId} has been approved and certificate is ready to download.`,
    });

    await AuditLog.create({
      userId: req.user._id,
      user: req.user.name,
      userInitials: req.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      action: "Application Approved",
      resource: `Application/${app.applicationId}`,
      status: "success",
    });

    await logAdminAction(req, "Approved application", "approval", { applicationId: app.applicationId });
    broadcastRealtime("dashboard:update", { applicationId: app.applicationId, status: app.status });

    res.status(200).json({ success: true, application: {
      id: app._id?.toString() || null,
      applicationId: app.applicationId,
      status: app.status,
      certificateNumber: app.certificateNumber,
      remarks: app.remarks,
    } });
  } catch (error) {
    next(error);
  }
};

export const rejectApplication = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || typeof reason !== "string") {
      return res.status(400).json({ success: false, message: "Rejection reason is required." });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    app.status = "rejected";
    app.remarks = reason;
    app.reviewedBy = req.user._id;
    await app.save();

    await Notification.create({
      userId: app.userId,
      title: "Application Rejected",
      message: `Your application ${app.applicationId} was rejected. Reason: ${reason}`,
    });

    await AuditLog.create({
      userId: req.user._id,
      user: req.user.name,
      userInitials: req.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      action: "Application Rejected",
      resource: `Application/${app.applicationId}`,
      status: "denied",
    });

    await logAdminAction(req, "Rejected application", "rejection", { applicationId: app.applicationId, reason });
    broadcastRealtime("dashboard:update", { applicationId: app.applicationId, status: app.status });

    res.status(200).json({ success: true, application: {
      id: app._id?.toString() || null,
      applicationId: app.applicationId,
      status: app.status,
      remarks: app.remarks,
    } });
  } catch (error) {
    next(error);
  }
};

export const getDocumentWallet = async (req, res, next) => {
  try {
    const citizenId = req.params.citizenId;
    const citizen = await User.findById(citizenId).select("name cnic district");
    if (!citizen) return res.status(404).json({ success: false, message: "Citizen not found." });

    const applications = await Application.find({ userId: citizenId }).sort({ createdAt: -1 });
    const documents = applications.flatMap((app) => app.documents.map((doc) => ({
      ...doc.toObject(),
      applicationId: app.applicationId,
      uploadedAt: doc.uploadedAt,
    })));
    const documentStatus = getDocumentStatus(documents);

    res.status(200).json({
      success: true,
      citizen: {
        id: citizen._id?.toString() || citizenId,
        name: citizen.name,
        cnic: citizen.cnic || "",
        district: citizen.district || "",
      },
      documents,
      documentStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatusTracker = async (req, res, next) => {
  try {
    const { district, startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = {};
    if (district && district !== "all") query.district = district;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const date = new Date(endDate);
        date.setHours(23, 59, 59, 999);
        query.createdAt.$lte = date;
      }
    }

    const total = await StatusTrackingLog.countDocuments(query);
    const entries = await StatusTrackingLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs: entries.map((entry) => ({
        id: entry._id?.toString() || null,
        citizenName: entry.citizenName,
        cnic: entry.cnic,
        district: entry.district,
        ipAddress: entry.ipAddress,
        time: entry.createdAt,
        eventType: entry.eventType,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getSupportClerks = async (req, res, next) => {
  try {
    const clerks = await User.find({ role: "clerk" }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      clerks: clerks.map((clerk) => ({
        id: clerk._id?.toString() || null,
        name: clerk.name || "",
        email: clerk.email || "",
        phone: clerk.phone || "",
        district: clerk.district || "",
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getPrivacyPolicy = async (req, res, next) => {
  try {
    let policy = await Setting.findOne({ key: "privacy_policy" });
    if (!policy) {
      policy = await Setting.create({ key: "privacy_policy", html: "<p>Welcome to the DMS AJ&K privacy policy.</p>" });
    }
    res.status(200).json({ success: true, html: policy.html });
  } catch (error) {
    next(error);
  }
};

export const updatePrivacyPolicy = async (req, res, next) => {
  try {
    const { html } = req.body;
    if (typeof html !== "string") {
      return res.status(400).json({ success: false, message: "Privacy policy content must be HTML." });
    }
    const policy = await Setting.findOneAndUpdate(
      { key: "privacy_policy" },
      { html },
      { new: true, upsert: true }
    );
    await logAdminAction(req, "Updated privacy policy", "privacy_policy", {});
    broadcastRealtime("privacy:update", { updatedAt: policy.updatedAt });
    res.status(200).json({ success: true, html: policy.html });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("name email district phone avatarUrl role");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, profile: {
      id: user._id?.toString() || null,
      name: user.name,
      email: user.email,
      district: user.district || null,
      phone: user.phone || null,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
    } });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, district, phone } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, district, phone },
      { new: true, runValidators: true }
    ).select("name email district phone avatarUrl role");
    if (!updated) return res.status(404).json({ success: false, message: "User not found." });
    await logAdminAction(req, "Updated profile", "profile", { userId: updated._id.toString() });
    res.status(200).json({ success: true, profile: updated });
  } catch (error) {
    next(error);
  }
};

export const saveProfileAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No profile file uploaded." });
    }
    const avatarUrl = req.file.path || `data:${req.file.mimetype};base64,${req.file.buffer?.toString("base64") || ""}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select("avatarUrl");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    await logAdminAction(req, "Updated profile avatar", "profile", {});
    res.status(200).json({ success: true, avatarUrl: user.avatarUrl });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users: users.map((u) => ({
        id: u._id?.toString() || null,
        name: u.name || "",
        email: u.email || "",
        role: u.role || "citizen",
        district: u.district || "",
        phone: u.phone || "",
        avatarUrl: u.avatarUrl || null,
        createdAt: u.createdAt || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

