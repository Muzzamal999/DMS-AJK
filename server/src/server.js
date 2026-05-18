import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import cloudinary from "./config/cloudinary.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { protect } from "./middlewares/auth.js";
import { initRealtimeServer } from "./utils/realtime.js";
import { downloadDocument } from "./controllers/applicationController.js";

import authRoutes from "./routes/auth.js";
import applicationRoutes from "./routes/applications.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

// Health Route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DMS AJ&K API running",
    timestamp: new Date(),
  });
});

app.get("/download/:fileId", protect, downloadDocument);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// START SERVER ONLY AFTER DB CONNECTS
const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDB();
    console.log("✅ MongoDB Connected");

    // Test Cloudinary connection
    const cloudinaryOk = cloudinary.config().cloud_name === process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudinaryOk && process.env.CLOUDINARY_API_KEY) {
      console.log(`☁️  Cloudinary Connected (${process.env.CLOUDINARY_CLOUD_NAME})`);
    } else {
      console.log("⚠️  Cloudinary not configured — using memory storage");
    }

    server.listen(PORT, () => {
      initRealtimeServer(server);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();