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
  documents: app.documents || [],
  submittedAt: app.createdAt || null,
  updatedAt: app.updatedAt || null,
  certificateNumber: app.certificateNumber || "",
  issuedAt: app.issuedAt || null,
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
        // Cloudinary storage provides path and filename; memory storage provides buffer
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
      fullName, fatherName, cnic, dateOfBirth,
      gender, district, currentAddress, permanentAddress,
      documents,
      status: "pending",
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

    let app;
    if (applicationId) {
      // Update existing draft
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
        documents.forEach((doc) => {
          app.documents = app.documents.filter((d) => d.label !== doc.label);
          app.documents.push(doc);
        });
      }
      await app.save();
    } else {
      // Create new draft
      app = await Application.create({
        userId: req.user._id,
        fullName: fullName || "",
        fatherName: fatherName || "",
        cnic: cnic || "",
        dateOfBirth: dateOfBirth || "",
        gender: gender || "",
        district: district || "",
        currentAddress: currentAddress || "",
        permanentAddress: permanentAddress || "",
        documents,
        status: "draft",
      });
    }

    res.status(200).json({ success: true, application: formatApp(app) });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications  — list (filtered by role)
export const getApplications = async (req, res, next) => {
  try {
    let query = {};

    // Citizens see only their own
    if (req.user.role === "citizen") {
      query.userId = req.user._id;
    }
    // Clerks see all (clerk filter by district optionally)
    // Admin sees all

    const { status, district, search, page = 1, limit = 20 } = req.query;
    if (status && status !== "all") query.status = status;
    if (district && district !== "all") query.district = district;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { cnic: { $regex: search, $options: "i" } },
        { applicationId: { $regex: search, $options: "i" } },
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
    const allowed = ["pending", "verified", "in_review", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found." });

    app.status = status;
    if (remarks) app.remarks = remarks;
    app.reviewedBy = req.user._id;

    if (status === "approved") {
      const year = new Date().getFullYear();
      app.certificateNumber = `AJ-${year}-${Math.floor(Math.random() * 9000 + 1000)}`;
      app.issuedAt = new Date();
    }

    await app.save();

    // Notify citizen
    const messages = {
      verified: "Your documents have been verified successfully.",
      in_review: "Your application is now under review by the officer.",
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
        // Remove existing doc with same label
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
    const app = await Application.findOne({ certificateNumber, status: "approved" });

    if (!app || !app.issuedAt) {
      return res.status(200).json({
        success: true,
        valid: false,
        message: "Certificate not found or invalid.",
      });
    }

    // Mask full name
    const maskName = (name) =>
      name.split(" ").map((p) => p[0] + "*".repeat(Math.max(0, p.length - 1))).join(" ");

    res.status(200).json({
      success: true,
      valid: true,
      certificateNumber: app.certificateNumber,
      fullNameMasked: maskName(app.fullName),
      district: app.district,
      issueDate: new Date(app.issuedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      }),
      status: "Authenticated",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/dashboard  — citizen dashboard summary
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const apps = await Application.find({ userId }).sort({ createdAt: -1 });
    const latest = apps[0];
    const notifCount = await Notification.countDocuments({ userId, read: false });

    const journey = {
      submitted: latest?.createdAt || null,
      verified: latest?.status === "verified" || latest?.status === "approved" ? latest.updatedAt : null,
      inReview: latest?.status === "in_review",
      issued: latest?.issuedAt || null,
      applicationRef: latest?.applicationId || null,
    };

    res.status(200).json({
      success: true,
      summary: {
        currentStatus: latest?.status || "No Application",
        applicationId: latest?.applicationId || null,
        certificatesIssued: apps.filter((a) => a.status === "approved").length,
        notificationCount: notifCount,
        applicationJourney: journey,
        recentActivity: apps.slice(0, 5).map((a) => ({
          id: a._id,
          description: `Application ${a.applicationId}`,
          detail: `Status: ${a.status}`,
          timeAgo: a.updatedAt,
          icon: "file",
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/:id/certificate — citizen downloads approved certificate (PDF)
export const downloadCertificate = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id).populate("userId", "name email district");

    if (!app) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    // Only owner or clerk/admin can download
    const isOwner = app.userId._id.toString() === req.user._id.toString();
    const isStaff = ["clerk", "admin"].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (app.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Certificate not yet issued. Application must be approved first.",
      });
    }

    if (!app.certificateNumber) {
      return res.status(400).json({
        success: false,
        message: "Certificate number not found.",
      });
    }

    // Find the photograph from documents
    let photoBuffer = null;
    const photoDoc = app.documents?.find((d) => d.label === "Passport Size Photograph");

    if (photoDoc && photoDoc.url) {
      try {
        const photoResponse = await fetch(photoDoc.url);
        if (photoResponse.ok) {
          photoBuffer = await photoResponse.buffer();
        }
      } catch (e) {
        console.warn("Could not fetch photo for certificate:", e.message);
      }
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${app.certificateNumber}.pdf"`
    );
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    doc.pipe(res);

    // Colors
    const borderColor = "#0d4f3c";
    const headerColor = "#0d4f3c";
    const textColor = "#1a1a1a";

    // Border frame
    doc
      .rect(15, 15, doc.page.width - 30, doc.page.height - 30)
      .lineWidth(3)
      .stroke(borderColor);

    // Inner border
    doc
      .rect(22, 22, doc.page.width - 44, doc.page.height - 44)
      .lineWidth(1)
      .stroke(borderColor);

    // Header background
    doc.rect(30, 30, doc.page.width - 60, 55).fill(headerColor);

    // Government header text
    doc.fillColor("#ffffff").fontSize(10);
    doc.text("GOVERNMENT OF AZAD JAMMU & KASHMIR", 30, 35, {
      align: "center",
      width: doc.page.width - 60,
    });

    doc.fontSize(16).font("Helvetica-Bold");
    doc.text("DOMICILE MANAGEMENT SYSTEM", 30, 48, {
      align: "center",
      width: doc.page.width - 60,
    });

    doc.fontSize(8).font("Helvetica");
    doc.text("Official Certificate of Domicile", 30, 65, {
      align: "center",
      width: doc.page.width - 60,
    });

    // Certificate title
    doc.moveDown(0.5);
    doc.fillColor(headerColor).fontSize(14).font("Helvetica-Bold");
    doc.text("CERTIFICATE OF DOMICILE", { align: "center" });

    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica");
    doc.fillColor(textColor);

    const issueDate = app.issuedAt
      ? new Date(app.issuedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    doc.text(`Certificate Number: ${app.certificateNumber}`, { align: "center" });
    doc.text(`Issue Date: ${issueDate}`, { align: "center" });
    doc.text(`Application Reference: ${app.applicationId}`, { align: "center" });

    // Horizontal line
    doc.moveDown(0.3);
    doc
      .moveTo(60, doc.y)
      .lineTo(doc.page.width - 60, doc.y)
      .lineWidth(1)
      .stroke(headerColor);

    doc.moveDown(0.5);

    // ===== PHOTO SECTION (Top Right Corner) =====
    const photoX = doc.page.width - 160;
    const photoY = doc.y - 5;
    const photoSize = 80;

    // Photo border box
    doc
      .rect(photoX, photoY, photoSize, photoSize)
      .lineWidth(2)
      .stroke("#333333");

    if (photoBuffer) {
      try {
        doc.image(photoBuffer, photoX, photoY, {
          fit: [photoSize, photoSize],
          align: "center",
          valign: "center",
        });
      } catch (imgErr) {
        doc
          .fontSize(8)
          .fillColor("#666666")
          .text("Photo", photoX, photoY + 30, { width: photoSize, align: "center" });
      }
    } else {
      doc
        .fontSize(8)
        .fillColor("#666666")
        .text("Photo", photoX, photoY + 30, { width: photoSize, align: "center" });
      doc
        .fontSize(6)
        .text("Not Available", photoX, photoY + 42, { width: photoSize, align: "center" });
    }

    // Photo label
    doc
      .fontSize(7)
      .fillColor("#333333")
      .text("PASSPORT SIZE PHOTO", photoX, photoY + photoSize + 2, { width: photoSize, align: "center" });

    // ===== LEFT SIDE: Applicant Details =====
    doc.fontSize(10).font("Helvetica-Bold").fillColor(headerColor);
    doc.text("APPLICANT DETAILS", 60);

    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").fillColor(textColor);

    doc.text(`Full Name: ${app.fullName}`, 60);
    doc.text(`Father's Name: ${app.fatherName}`, 60);
    doc.text(`CNIC Number: ${app.cnic}`, 60);
    doc.text(`Date of Birth: ${app.dateOfBirth}`, 60);
    doc.text(`Gender: ${app.gender}`, 60);
    doc.text(`District: ${app.district}`, 60);

    doc.moveDown(0.5);

    // Addresses
    doc.text(`Current Address: ${app.currentAddress}`, 60);
    doc.text(`Permanent Address: ${app.permanentAddress}`, 60);

    doc.moveDown(0.5);

    // Certification
    doc.fontSize(10).font("Helvetica-Bold").fillColor(headerColor);
    doc.text("CERTIFICATION", 60);

    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").fillColor(textColor);

    const certifyText = `This is to certify that the above-named person is a bona fide resident of ${app.district}, Azad Jammu & Kashmir, Pakistan, and is entitled to all rights and privileges of a domicile of the aforementioned region.`;

    doc.text(certifyText, 60, doc.y, {
      align: "justify",
      width: doc.page.width - 240,
    });

    // Verification URL
    doc.moveDown(1);
    doc.fontSize(8).fillColor("#666666");
    doc.text("Scan to verify: ", 60);
    doc.fontSize(8).fillColor(headerColor);
    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify/${app.certificateNumber}`;
    doc.text(verifyUrl, 60, doc.y + 12, { link: verifyUrl, underline: true });

    // Footer
    const footerY = doc.page.height - 55;
    doc
      .moveTo(60, footerY)
      .lineTo(doc.page.width - 60, footerY)
      .stroke(headerColor);

    doc.fontSize(7).fillColor("#666666");
    doc.text(
      "This is an official digital certificate issued by the Government of Azad Jammu & Kashmir.",
      60,
      footerY + 8,
      { align: "center", width: doc.page.width - 120 }
    );
    doc.text(
      "Unauthorized reproduction or tampering with this certificate is punishable by law.",
      { align: "center", width: doc.page.width - 120 }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};
