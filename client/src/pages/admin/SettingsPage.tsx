import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings as SettingsIcon, Save, Camera } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { AJK_DISTRICTS } from "@/constants";
import type { Profile } from "@/types";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    district: "",
    phone: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getProfile();
      setProfile(res.profile);
      setFormData({
        name: res.profile.name || "",
        district: res.profile.district || "",
        phone: res.profile.phone || "",
        email: res.profile.email || "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await adminApi.updateProfile(formData);
      setProfile(res.profile);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await adminApi.uploadAvatar(formData);
      setProfile((prev) => prev ? { ...prev, avatarUrl: res.avatarUrl } : prev);
      toast.success("Avatar updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar.");
    }
  };

  if (isLoading) {
    return (
      <AdminSidebar>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-64 bg-muted animate-pulse rounded-xl" />
            <div className="h-64 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your admin profile and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-2 border-border">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {getInitials(formData.name || "A")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90">
                    <Camera size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="font-medium">{formData.name || "Admin"}</p>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                  <p className="text-xs text-primary mt-1">Administrator</p>
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
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                <Save size={14} className="mr-2" /> {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Account Role</p>
                <p className="font-medium capitalize">{profile?.role || "admin"}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                <p className="font-medium">
                  {profile?.id ? new Date().toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Last Profile Update</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
}