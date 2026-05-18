import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  district: user.district,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  profileUpdatedAt: user.profileUpdatedAt,
  passwordChangedAt: user.passwordChangedAt,
  createdAt: user.createdAt,
});

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, cnic, role, district } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const user = await User.create({ name, email, password, cnic, role, district });

    const token = signToken(user._id);

    await AuditLog.create({
      userId: user._id,
      user: user.name,
      userInitials: name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      action: "User Registered",
      resource: `User/${user._id}`,
      status: "success",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please check email, password, and role.",
      });
    }

    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Invalid role selected. This account is registered as ${user.role}. Please select the correct role.`,
      });
    }

    const token = signToken(user._id);

    await AuditLog.create({
      userId: user._id,
      user: user.name,
      userInitials: user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      action: "User Login",
      resource: `Auth/${user.role}`,
      status: "success",
    });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/me
export const updateMe = async (req, res, next) => {
  try {
    const { name, district, phone, avatarUrl } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (district !== undefined) updateFields.district = district;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

    // Set profileUpdatedAt whenever profile is updated
    updateFields.profileUpdatedAt = new Date();

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, user: formatUser(updated) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Check 30-day restriction
    const userForCheck = await User.findById(req.user._id);
    if (userForCheck && userForCheck.passwordChangedAt) {
      const daysSinceChange = (Date.now() - new Date(userForCheck.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceChange < 30) {
        const daysLeft = Math.ceil(30 - daysSinceChange);
        return res.status(429).json({
          success: false,
          message: `Password change restricted. You can only change your password once every 30 days. Please try again in ${daysLeft} day(s).`,
        });
      }
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};