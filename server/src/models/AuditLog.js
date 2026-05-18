import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userInitials: { type: String },
    user: { type: String },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    status: {
      type: String,
      enum: ["success", "pending", "denied"],
      default: "success",
    },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
