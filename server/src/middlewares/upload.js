import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Check if Cloudinary is properly configured
const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name";

let storage;

if (cloudinaryConfigured) {
  // Use Cloudinary storage for production
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      return {
        folder: `dms-ajk/documents/${req.user?.id || "anonymous"}`,
        allowed_formats: ["jpg", "jpeg", "png", "pdf"],
        resource_type: "auto",
        public_id: `${Date.now()}-${file.fieldname}`,
      };
    },
  });
} else {
  // Use memory storage as fallback when Cloudinary is not configured
  console.warn("⚠️  Cloudinary not configured — using memory storage for uploads.");
  storage = multer.memoryStorage();
}

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and PDF files are allowed."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// For multiple named fields (CNIC front, CNIC back, photo, residence proof)
export const uploadDocuments = upload.fields([
  { name: "cnic_front", maxCount: 1 },
  { name: "cnic_back", maxCount: 1 },
  { name: "photograph", maxCount: 1 },
  { name: "residence_proof", maxCount: 1 },
]);
