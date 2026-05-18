import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, select: false },
  cnic: String,
  role: { type: String, enum: ["citizen", "clerk", "admin"], default: "citizen" },
  district: String,
  phone: String,
  avatarUrl: String,
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model("User", userSchema);

const seedUsers = [
  { name: "Super Admin", email: "admin@dms.gov.pk", password: "Admin@123", role: "admin", district: "Muzaffarabad" },
  { name: "Support Clerk", email: "clerk@dms.gov.pk", password: "Clerk@123", role: "clerk", district: "Mirpur" },
  { name: "Test Citizen", email: "citizen@dms.gov.pk", password: "Citizen@123", role: "citizen", district: "Rawalakot", cnic: "13101-1234567-8" },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    for (const u of seedUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`⏭️  ${u.email} already exists — skipping`);
        continue;
      }
      const user = new User(u);
      await user.save();
      console.log(`✅ Created ${u.role}: ${u.email} / ${u.password}`);
    }

    console.log("\n🎉 Seed complete!\n");
    console.log("Demo accounts:");
    console.log("  Admin   → admin@dms.gov.pk    / Admin@123");
    console.log("  Clerk   → clerk@dms.gov.pk    / Clerk@123");
    console.log("  Citizen → citizen@dms.gov.pk  / Citizen@123");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
