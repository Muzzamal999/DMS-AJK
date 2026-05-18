import PDFDocument from "pdfkit";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import StatusTrackingLog from "../models/StatusTrackingLog.js";
import cloudinary from "../config/cloudinary.js";

const formatApp = (app) => ({
  id: app._id?.toString() || null,
  applicationId: app.applicationId || "",
  userId: app.userId?._id ? app.userId._id.toString() : app.userId?.toString() || null,
  citizenName: app.citizenName || "",
  fullName: app.fullName || "",
  fatherName: app.fatherName || "",
  cnic: app.cnic || "",
  dateOfBirth: app.dateOfBirth || "",
  gender: app.gender || "",
  district: app.district || "",
  currentAddress: app.currentAddress || "",
  permanentAddress: app.permanentAddress || "",
  status: app.status || "pending",
  remarks: app.remarks || "",
  clerkRemarks: app.clerkRemarks || [],
  statusHistory: app.statusHistory || [],
  documents: app.documents || [],
  submittedAt: app.createdAt || null,
  updatedAt: app.updatedAt || null,
  certificateNumber: app.certificateNumber || "",
  issuedAt: app.issuedAt || null,
  reviewedBy: app.reviewedBy || null,
});

// POST /api/applications  — create (with optional document uploads)
export const createApplication = async (req, res, next) => {
  try {
    const {
      fullName, fatherName, cnic, dateOfBirth,
      gender, district, currentAddress, permanentAddress,
    } = req.body;

    // Build documents array from Cloudinary uploads
    const documents = [];
    const fieldLabels = {
      cnic_front: "CNIC Copy (Front)",
      cnic_back: "CNIC Copy (Back)",
      photograph: "Passport Size Photograph",
      residence_proof: "Proof of Residence",
    };

    if (req.files) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        const file = files[0];
        const url = file.path || `data:${file.mimetype};base64,${file.buffer?.toString("base64") || ""}`;
        const publicId = file.filename || `${Date.now()}-${fieldName}`;
        documents.push({
          label: fieldLabels[fieldName] || fieldName,
          url,
          publicId,
          format: file.mimetype,
          uploadedAt: new Date(),
        });
      }
    }

    const app = await Application.create({
      userId: req.user._id,
      citizenName: req.user.name,
      fullName, fatherName, cnic, dateOfBirth,
      gender, district, currentAddress, permanentAddress,
      documents,
      status: "pending",
      statusHistory: [{
        status: "pending",
        changedBy: req.user._id,
        changedByName: req.user.name,
        remarks: "Application submitted",
        createdAt: new Date(),
      }],
    });

    // Notify citizen
    await Notification.create({
      userId: req.user._id,
      title: "Application Submitted",
      message: `Your application ${app.applicationId} has been submitted and is pending review.`,
    });

    await AuditLog.create({
      userId: req.user._id,
      user: req.user.name,
      userInitials: req.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      action: "Application Submitted",
      resource: `Application/${app.applicationId}`,
      status: "success",
    });

    res.status(201).json({ success: true, application: formatApp(app) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/applications/draft  — save or update a draft application
export const saveDraft = async (req, res, next) => {
  try {
    const {
      applicationId,
      fullName, fatherName, cnic, dateOfBirth,
      gender, district, currentAddress, permanentAddress,
    } = req.body;

    const documents = [];
    const fieldLabels = {
      cnic_front: "CNIC Copy (Front)",
      cnic_back: "CNIC Copy (Back)",
      photograph: "Passport Size Photograph",
      residence_proof: "Proof of Residence",
    };

    if (req.files) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        const file = files[0];
        const url = file.path || `data:${file.mimetype};base64,${file.buffer?.toString("base64") || ""}`;
        const publicId = file.filename || `${Date.now()}-${fieldName}`;
        documents.push({
          label: fieldLabels[fieldName] || fieldName,
          url,
          publicId,
          format: file.mimetype,
          uploadedAt: new Date(),
        });
      }
    }

    let app;
    if (applicationId) {
      app = await Application.findOne({ applicationId, userId: req.user._id });
      if (!app) {
        return res.status(404).json({ success: false, message: "Draft application not found." });
      }
      if (fullName !== undefined) app.fullName = fullName;
      if (fatherName !== undefined) app.fatherName = fatherName;
      if (cnic !== undefined) app.cnic = cnic;
      if (dateOfBirth !== undefined) app.dateOfBirth = dateOfBirth;
      if (gender !== undefined) app.gender = gender;
      if (district !== undefined) app.district = district;
      if (currentAddress !== undefined) app.currentAddress = currentAddress;
      if (permanentAddress !== undefined) app.permanentAddress = permanentAddress;

      if (documents.length > 0) {
        for (const doc of documents) {
          const existingIdx = app.documents.findIndex((d) => d.label === doc.label);
          if (existingIdx >= 0) {
            app.documents[existingIdx] = doc;
          } else {
            app.documents.push(doc);
          }
        }
      }

      await app.save();
      return res.status(200).json({ success: true, application: formatApp(app) });
    }

    // Create new draft
    app = await Application.create({
      userId: req.user._id,
      citizenName: req.user.name,
      fullName: fullName || "",
      fatherName: fatherName || "",
      cnic: cnic || "",
      dateOfBirth: dateOfBirth || "",
      gender: gender || "male",
      district: district || "",
      currentAddress: currentAddress || "",
      permanentAddress: permanentAddress || "",
      documents,
      status: "draft",
    });

    res.status(201).json({ success: true, application: formatApp(app) });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications  — list (filtered by role)
export const getApplications = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === "citizen") {
      query.userId = req.user._id;
    }

    const { status, district, search, page = 1, limit = 20 } = req.query;
    if (status && status !== "all") query.status = status;
    if (district && district !== "all") query.district = district;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { cnic: { $regex: search, $options: "i" } },
        { applicationId: { $regex: search, $options: "i" } },
        { citizenName: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Application.countDocuments(query);
    const apps = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      applications: apps.map(formatApp),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/:id
export const getApplication = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id).populate("userId", "name email");
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    if (req.user.role === "citizen") {
      const appUserId = app.userId?._id ? app.userId._id.toString() : app.userId.toString();
      if (appUserId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    res.status(200).json({ success: true, application: formatApp(app) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/applications/:id/status  — Clerk or Admin
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const allowed = ["pending", "in_review", "verified", "approved", "rejected", "forwarded_to_admin"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    const previousStatus = app.status;
    app.status = status;
    if (remarks) {
      app.remarks = remarks;
      app.clerkRemarks.push({
        text: remarks,
        author: req.user._id,
        authorName: req.user.name,
        createdAt: new Date(),
      });
    }
    app.reviewedBy = req.user._id;

    // Track status history
    app.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      remarks: remarks || `Status changed from ${previousStatus} to ${status}`,
      createdAt: new Date(),
    });

    if (status === "approved") {
      const year = new Date().getFullYear();
      app.certificateNumber = `AJ-${year}-${Math.floor(Math.random() * 9000 + 1000)}`;
      app.issuedAt = new Date();
    }

    await app.save();

    // Status messages
    const messages = {
      in_review: "Your application is now under verification by the clerk.",
      verified: "Your documents have been verified. Application forwarded to admin for final approval.",
      forwarded_to_admin: "Your application has been forwarded to admin for final review.",
      approved: `Congratulations! Your domicile certificate (${app.certificateNumber}) has been issued.`,
      rejected: `Your application was rejected. Reason: ${remarks || "Please contact the office."}`,
    };

    if (messages[status]) {
      await Notification.create({
        userId: app.userId,
        title: `Application ${status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}`,
        message: messages[status],
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      user: req.user.name,
      userInitials: req.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      action: `Status Updated → ${status}`,
      resource: `Application/${app.applicationId}`,
      status: "success",
    });

    res.status(200).json({ success: true, application: formatApp(app) });
  } catch (error) {
    next(error);
  }
};

export const trackApplicationStatus = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    const userId = req.user?._id || null;
    await StatusTrackingLog.create({
      citizenName: app.fullName,
      cnic: app.cnic,
      district: app.district,
      ipAddress: req.headers["x-forwarded-for"] || req.ip || "unknown",
      eventType: "status_check",
      userId,
    });

    res.status(200).json({ success: true, message: "Tracking log recorded." });
  } catch (error) {
    next(error);
  }
};

// POST /api/applications/:id/documents  — upload docs to existing application
export const uploadDocuments = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    const appUserId = app.userId?._id ? app.userId._id.toString() : app.userId.toString();
    if (appUserId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const fieldLabels = {
      cnic_front: "CNIC Copy (Front)",
      cnic_back: "CNIC Copy (Back)",
      photograph: "Passport Size Photograph",
      residence_proof: "Proof of Residence",
    };

    if (req.files) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        const file = files[0];
        const url = file.path || `data:${file.mimetype};base64,${file.buffer?.toString("base64") || ""}`;
        const publicId = file.filename || `${Date.now()}-${fieldName}`;
        app.documents = app.documents.filter(
          (d) => d.label !== (fieldLabels[fieldName] || fieldName)
        );
        app.documents.push({
          label: fieldLabels[fieldName] || fieldName,
          url,
          publicId,
          format: file.mimetype,
          uploadedAt: new Date(),
        });
      }
    }

    await app.save();
    res.status(200).json({ success: true, documents: app.documents });
  } catch (error) {
    next(error);
  }
};

// GET /download/:fileId — redirect to stored document URL or return direct data URI
export const downloadDocument = async (req, res, next) => {
  try {
    const fileId = req.params.fileId;
    const app = await Application.findOne({ "documents._id": fileId });
    if (!app) return res.status(404).json({ success: false, message: "File not found." });

    const document = app.documents.id(fileId);
    if (!document) return res.status(404).json({ success: false, message: "File not found." });

    if (typeof document.url === "string" && document.url.startsWith("http")) {
      return res.redirect(document.url);
    }

    res.status(200).json({ success: true, url: document.url, label: document.label });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/verify/:certificateNumber  — public
export const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateNumber } = req.params;
    const app = await Application.findOne({ certificateNumber }).populate("userId", "name");
    if (!app) {
      return res.status(404).json({ success: false, message: "Certificate not found." });
    }

    res.status(200).json({
      success: true,
      certificate: {
        certificateNumber: app.certificateNumber,
        holderName: app.fullName,
        fatherName: app.fatherName,
        district: app.district,
        issuedAt: app.issuedAt,
        status: app.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/:id/certificate — download PDF
export const downloadCertificate = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    if (app.status !== "approved" || !app.certificateNumber) {
      return res.status(400).json({ success: false, message: "Certificate not available." });
    }

    const doc = new PDFDocument({ margin: 60 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${app.certificateNumber}.pdf"`);
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f8fafc");
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke("#1e40af", 2);

    doc.fontSize(22).fillColor("#1e40af").text("Government of Azad Jammu & Kashmir", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor("#374151").text("Domicile Management System", { align: "center" });
    doc.moveDown(0.8);
    doc.fontSize(14).fillColor("#6b7280").text("OFFICIAL DOMICILE CERTIFICATE", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor("#374151");
    doc.text(`Certificate Number: ${app.certificateNumber}`, { align: "center" });
    doc.moveDown(0.5);
    doc.text(`Holder Name: ${app.fullName}`, { align: "center" });
    doc.moveDown(0.3);
    doc.text(`Father's Name: ${app.fatherName}`, { align: "center" });
    doc.moveDown(0.3);
    doc.text(`CNIC: ${app.cnic}`, { align: "center" });
    doc.moveDown(0.3);
    doc.text(`District: ${app.district}`, { align: "center" });
    doc.moveDown(0.3);
    doc.text(`Date of Birth: ${app.dateOfBirth}`, { align: "center" });
    doc.moveDown(0.3);
    doc.text(`Permanent Address: ${app.permanentAddress}`, { align: "center" });
    doc.moveDown(1.5);
    doc.text(`Issue Date: ${app.issuedAt ? new Date(app.issuedAt).toLocaleDateString() : "N/A"}`, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10).fillColor("#9ca3af").text("This certificate is issued by the Domicile Management System, Government of AJK.", { align: "center" });
    doc.text("Verify at: https://dms.ajk.gov.pk/verify", { align: "center" });

    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f8fafc");

    doc.fontSize(16).fillColor("#1e40af").text("Document Checklist", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(11).fillColor("#374151");

    for (const docItem of app.documents) {
      doc.text(`✓ ${docItem.label}`, { align: "left" });
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#6b7280").text("Application ID: " + app.applicationId, { align: "center", width: doc.page.width - 120 });
    doc.text("Submitted: " + new Date(app.createdAt).toLocaleDateString(), { align: "center" });
    doc.addPage();

    for (const docItem of app.documents) {
      if (docItem.format && docItem.format.startsWith("image/")) {
        try {
          doc.image(docItem.url, { fit: [doc.page.width - 120, 400], align: "center" });
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor("#6b7280").text(docItem.label, { align: "center" });
          doc.addPage();
        } catch {
          // Skip invalid images
        }
      }
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/dashboard — summary for dashboard
export const getDashboardSummary = async (req, res, next) => {
  try {
    const query = req.user.role === "citizen" ? { userId: req.user._id } : {};

    const total = await Application.countDocuments({ ...query, status: { $ne: "draft" } });
    const pending = await Application.countDocuments({ ...query, status: "pending" });
    const inReview = await Application.countDocuments({ ...query, status: "in_review" });
    const verified = await Application.countDocuments({ ...query, status: "verified" });
    const approved = await Application.countDocuments({ ...query, status: "approved" });
    const rejected = await Application.countDocuments({ ...query, status: "rejected" });
    const forwarded = await Application.countDocuments({ ...query, status: "forwarded_to_admin" });

    const recent = await Application.find({ ...query, status: { $ne: "draft" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("applicationId fullName district status createdAt");

    res.status(200).json({
      success: true,
      summary: { total, pending, inReview, verified, approved, rejected, forwarded, recent },
    });
  } catch (error) {
    next(error);
  }
};