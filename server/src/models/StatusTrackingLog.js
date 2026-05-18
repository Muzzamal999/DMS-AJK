import mongoose from "mongoose";

const statusTrackingLogSchema = new mongoose.Schema(
  {
    citizenName: {
      type: String,
      required: true,
    },
    cnic: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      default: "status_check",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const StatusTrackingLog = mongoose.model("StatusTrackingLog", statusTrackingLogSchema);
export default StatusTrackingLog;
