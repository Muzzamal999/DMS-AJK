import mongoose from "mongoose";

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    context: {
      type: String,
      default: "admin_panel",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const AdminActivityLog = mongoose.model("AdminActivityLog", adminActivityLogSchema);
export default AdminActivityLog;
