import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, default: null },
  format: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, required: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    district: { type: String, required: true },
    currentAddress: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "pending", "verified", "in_review", "approved", "rejected"],
      default: "draft",
    },
    remarks: { type: String, default: null },
    documents: [documentSchema],
    certificateNumber: { type: String, default: null },
    issuedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate applicationId before saving
applicationSchema.pre("save", async function () {
  if (!this.applicationId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Application").countDocuments();
    this.applicationId = `DMS-${year}-${String(count + 1).padStart(4, "0")}`;
  }
});

const Application = mongoose.model("Application", applicationSchema);
export default Application;
