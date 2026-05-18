import Notification from "../models/Notification.js";

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    const formatted = notifications.map((n) => ({
      id: n._id?.toString() || null,
      userId: n.userId?.toString() || null,
      title: n.title || "",
      message: n.message || "",
      read: n.read || false,
      createdAt: n.createdAt || null,
    }));

    res.status(200).json({ success: true, notifications: formatted });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found." });

    res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/mark-all-read
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
};
