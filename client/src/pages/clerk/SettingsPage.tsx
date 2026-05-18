import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings as SettingsIcon, Save, Camera, Shield, Lock, AlertCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { AJK_DISTRICTS } from "@/constants";

const DAYS_BETWEEN_UPDATES = 30;

function isUpdateAllowed(timestamp: string | null | undefined): boolean {
  if (!timestamp) return true;
  const lastUpdate = new Date(timestamp);
  const daysPassed = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  return daysPassed >= DAYS_BETWEEN_UPDATES;
}

function daysUntilNextUpdate(timestamp: string | null | undefined): number {
  if (!timestamp) return 0;
  const lastUpdate = new Date(timestamp);
  const nextUpdate = new Date(lastUpdate.getTime() + DAYS_BETWEEN_UPDATES * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((nextUpdate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
}

export default function ClerkSettingsPage() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    district: "",
    phone: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        district: user.district || "",
        phone: user.phone || "",
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authApi.updateMe({
        name: formData.name,
        district: formData.district,
        phone: formData.phone,
        avatarUrl: avatarPreview || undefined,
      });
      login(res.user, localStorage.getItem("dms_auth_token") || "");
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSuccess(true);
      setTimeout(() => setShowPasswordSuccess(false), 5000);
      const userRes = await authApi.getMe();
      login(userRes.user, localStorage.getItem("dms_auth_token") || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const canUpdateProfile = isUpdateAllowed(user?.profileUpdatedAt as string | null | undefined);
  const profileDaysLeft = daysUntilNextUpdate(user?.profileUpdatedAt as string | null | undefined);

  const canChangePassword = isUpdateAllowed(user?.passwordChangedAt as string | null | undefined);
  const passwordDaysLeft = daysUntilNextUpdate(user?.passwordChangedAt as string | null | undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-border">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt={formData.name} />
                  ) : null}
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(formData.name || "C")}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90">
                  <Camera size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarChange(file);
                    }}
                  />
                </label>
              </div>
              <div>
                <p className="font-medium">{formData.name || "Clerk"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-primary mt-1">Clerk Account</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">Assigned District</Label>
                <select
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData((f) => ({ ...f, district: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select District</option>
                  {AJK_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">You can only process applications from your assigned district</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="03XX-XXXXXXX"
                />
              </div>
            </div>

            {!canUpdateProfile ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Profile update restricted</p>
                  <p className="text-xs text-amber-600 mt-1">
                    You can update your profile again in <strong>{profileDaysLeft} day{profileDaysLeft !== 1 ? "s" : ""}</strong>.
                    Changes are allowed once every 30 days.
                  </p>
                </div>
              </div>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                <Save size={14} className="mr-2" /> {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={18} /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showPasswordSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                Password changed successfully!
              </div>
            )}

            {!canChangePassword ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Password change restricted</p>
                  <p className="text-xs text-amber-600 mt-1">
                    You can change your password again in <strong>{passwordDaysLeft} day{passwordDaysLeft !== 1 ? "s" : ""}</strong>.
                    Changes are allowed once every 30 days.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData((f) => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((f) => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                  className="w-full"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}