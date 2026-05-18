import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { adminApi, notificationApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Layers, Clock3, CheckCircle, XCircle, Mail, Phone } from "lucide-react";
import type {
  AdminStats,
  VolumeDataPoint,
  DistrictCount,
  AuditLog,
  AdminApplication,
  StatusSummary,
  DocumentWallet,
  StatusTrackerLog,
  SupportClerk,
  Profile,
  Notification,
} from "@/types";
import { formatDate, getInitials } from "@/lib/utils";

const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  try {
    const parsed = new URL(apiUrl);
    return `${parsed.protocol === "https:" ? "wss:" : "ws:"}//${parsed.host}`;
  } catch {
    return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
  }
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [districtData, setDistrictData] = useState<DistrictCount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statusSummary, setStatusSummary] = useState<StatusSummary | null>(null);
  const [forwardedApps, setForwardedApps] = useState<AdminApplication[]>([]);
  const [documentWallet, setDocumentWallet] = useState<DocumentWallet | null>(null);
  const [selectedCitizenId, setSelectedCitizenId] = useState<string>("");
  const [statusTracker, setStatusTracker] = useState<StatusTrackerLog[]>([]);
  const [supportClerks, setSupportClerks] = useState<SupportClerk[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [privacyHtml, setPrivacyHtml] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", district: "", phone: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [trackerFilters, setTrackerFilters] = useState({ district: "all", startDate: "", endDate: "" });
  const [isPolicySaving, setIsPolicySaving] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashboard, statusRes, appsRes, clerksRes, policyRes, profileRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getApplicationStatus(),
        adminApi.getApplications({ forwarded: "true", status: "all" }),
        adminApi.getSupportClerks(),
        adminApi.getPrivacyPolicy(),
        adminApi.getProfile(),
      ]);

      const notificationsRes = await notificationApi.list();

      setStats(dashboard.stats);
      setVolumeData(dashboard.volumeData);
      setDistrictData(dashboard.districtData);
      setAuditLogs(dashboard.auditLogs);
      setStatusSummary(statusRes.statusSummary);
      setForwardedApps(appsRes.applications as AdminApplication[]);
      setSupportClerks(clerksRes.clerks);
      setPrivacyHtml(policyRes.html);
      setProfile(profileRes.profile);
      setProfileForm({
        name: profileRes.profile.name,
        district: profileRes.profile.district || "",
        phone: profileRes.profile.phone || "",
      });
      setNotifications(notificationsRes.notifications);
      if (!selectedCitizenId && appsRes.applications.length > 0) {
        setSelectedCitizenId(appsRes.applications[0].userId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCitizenId]);

  const fetchStatusTracker = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (trackerFilters.district && trackerFilters.district !== "all") params.district = trackerFilters.district;
      if (trackerFilters.startDate) params.startDate = trackerFilters.startDate;
      if (trackerFilters.endDate) params.endDate = trackerFilters.endDate;
      const res = await adminApi.getStatusTracker(params);
      setStatusTracker(res.logs);
    } catch (err: any) {
      toast.error(err.message || "Failed to load status tracker logs.");
    }
  }, [trackerFilters]);

  const fetchDocumentWallet = useCallback(async (citizenId?: string) => {
    if (!citizenId) return;
    try {
      const res = await adminApi.getDocumentWallet(citizenId);
      setDocumentWallet({
        citizen: res.citizen,
        documents: res.documents,
        documentStatus: res.documentStatus,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to load document wallet.");
    }
  }, []);

  useEffect(() => {
    refreshData();
    fetchStatusTracker();
  }, [refreshData, fetchStatusTracker]);

  useEffect(() => {
    if (selectedCitizenId) {
      fetchDocumentWallet(selectedCitizenId);
    }
  }, [fetchDocumentWallet, selectedCitizenId]);

  useEffect(() => {
    const socket = new WebSocket(getWebSocketUrl());
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "dashboard:update" || message.type === "privacy:update") {
          refreshData();
        }
        if (message.type === "notification:new") {
          notificationApi.list().then((res) => setNotifications(res.notifications));
        }
      } catch {
        // ignore malformed messages
      }
    });
    return () => socket.close();
  }, [refreshData]);

  const handleReview = (app: AdminApplication) => {
    setSelectedApp(app);
    setIsReviewOpen(true);
  };

  const handleApprove = async (applicationId: string) => {
    setIsProcessingAction(true);
    try {
      await adminApi.approveApplication(applicationId);
      toast.success("Application approved.");
      refreshData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve application.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectReason.trim()) {
      toast.error("Please add a reason for rejection.");
      return;
    }
    setIsProcessingAction(true);
    try {
      await adminApi.rejectApplication(selectedApp.id, rejectReason.trim());
      toast.success("Application rejected.");
      setRejectReason("");
      setIsReviewOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject application.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handlePolicySave = async () => {
    setIsPolicySaving(true);
    try {
      await adminApi.updatePrivacyPolicy(privacyHtml);
      toast.success("Privacy policy updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save privacy policy.");
    } finally {
      setIsPolicySaving(false);
    }
  };

  const handleProfileSave = async () => {
    setIsProfileSaving(true);
    try {
      const res = await adminApi.updateProfile(profileForm);
      setProfile(res.profile);
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await adminApi.uploadAvatar(formData);
      setProfile((prev) => prev ? { ...prev, avatarUrl: res.avatarUrl } : prev);
      toast.success("Profile avatar updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar.");
    }
  };

  const reviewDocuments = selectedApp?.documents || [];
  const dashboardCards = [
    { label: "Total Applications", value: stats?.totalApplications ?? 0, icon: <Layers className="w-4 h-4" /> },
    { label: "Pending", value: stats?.pendingVerification ?? 0, icon: <Clock3 className="w-4 h-4" /> },
    { label: "Approved", value: stats?.approvedCertificates ?? 0, icon: <CheckCircle className="w-4 h-4" /> },
    { label: "Rejected", value: stats?.rejectedFraudAlerts ?? 0, icon: <XCircle className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-96 rounded-2xl bg-muted animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Real-time metrics, application review, document wallet and support tools.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={refreshData}>Refresh</Button>
              <Button>{`Signed in as ${user?.name ?? "Admin"}`}</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {dashboardCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-[0.24em] font-semibold">
                    <span>{card.label}</span>
                    <span>{card.icon}</span>
                  </div>
                  <div className="text-4xl font-semibold">{card.value.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Application Volume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="mt-2 text-3xl font-semibold">{statusSummary?.completion ?? 0}%</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">In Review</p>
                    <p className="mt-2 text-3xl font-semibold">{statusSummary?.inReview ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="mt-2 text-3xl font-semibold">{statusSummary?.verified ?? 0}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {districtData.map((district) => (
                    <div key={district.district} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: district.color }} />
                        <span>{district.district}</span>
                      </div>
                      <span className="font-semibold">{district.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.resource}</p>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">{log.timestamp}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="applications" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">My Applications</h2>
              <p className="text-sm text-muted-foreground">Applications forwarded by clerks for your review.</p>
            </div>
            <Button variant="outline" onClick={refreshData}>Reload list</Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Citizen</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forwardedApps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No forwarded applications available.
                    </TableCell>
                  </TableRow>
                ) : forwardedApps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>{app.applicationId}</TableCell>
                    <TableCell>{app.fullName}</TableCell>
                    <TableCell>{app.district}</TableCell>
                    <TableCell><StatusBadge status={app.status as any} /></TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleReview(app)}>Review</Button>
                      <Button size="sm" onClick={() => handleApprove(app.id)} disabled={isProcessingAction}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        setSelectedApp(app);
                        setIsReviewOpen(true);
                      }}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section id="documents" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Document Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="citizen-select">Citizen</Label>
                  <select
                    id="citizen-select"
                    value={selectedCitizenId}
                    onChange={(event) => setSelectedCitizenId(event.target.value)}
                    className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {forwardedApps.map((app) => (
                      <option key={app.id} value={app.userId}>{`${app.fullName} — ${app.cnic}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              {documentWallet ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm text-muted-foreground">Citizen</p>
                      <p className="mt-2 font-semibold">{documentWallet.citizen.name}</p>
                      <p className="text-sm text-muted-foreground">{documentWallet.citizen.cnic}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm text-muted-foreground">District</p>
                      <p className="mt-2 font-semibold">{documentWallet.citizen.district}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentWallet.documentStatus.map((doc) => (
                      <div key={doc.label} className="rounded-xl border border-border p-4 flex items-center justify-between">
                        <span>{doc.label}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${doc.present ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {doc.present ? "Uploaded" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {documentWallet.documents.map((doc) => (
                      <div key={doc.id || doc.publicId} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{doc.label}</p>
                            <p className="text-muted-foreground text-sm">Uploaded {doc.uploadedAt ? formatDate(doc.uploadedAt) : "unknown"}</p>
                          </div>
                          <a href={`/download/${doc.id || doc.publicId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Download</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Select a forwarded application to view the citizen&apos;s document wallet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="tracker-district">District</Label>
                  <Input
                    id="tracker-district"
                    placeholder="All districts"
                    value={trackerFilters.district}
                    onChange={(event) => setTrackerFilters((prev) => ({ ...prev, district: event.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tracker-start">From</Label>
                    <Input
                      id="tracker-start"
                      type="date"
                      value={trackerFilters.startDate}
                      onChange={(event) => setTrackerFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tracker-end">To</Label>
                    <Input
                      id="tracker-end"
                      type="date"
                      value={trackerFilters.endDate}
                      onChange={(event) => setTrackerFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={fetchStatusTracker} className="w-full">Apply filters</Button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusTracker.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tracker entries found.</TableCell>
                      </TableRow>
                    ) : statusTracker.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.citizenName}</TableCell>
                        <TableCell>{log.cnic}</TableCell>
                        <TableCell>{log.district}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{formatDate(log.time)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="notifications" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className={`rounded-2xl border p-4 ${notif.read ? "border-border bg-background" : "border-primary/20 bg-primary/5"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{notif.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(notif.createdAt)}</span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">No notifications yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Clerks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supportClerks.map((clerk) => (
                <div key={clerk.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{clerk.name}</p>
                      <p className="text-sm text-muted-foreground">{clerk.district}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${clerk.email}`} className="text-muted-foreground hover:text-foreground"><Mail className="w-4 h-4" /></a>
                      <a href={`tel:${clerk.phone}`} className="text-muted-foreground hover:text-foreground"><Phone className="w-4 h-4" /></a>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{clerk.email}</p>
                  <p className="text-sm text-muted-foreground">{clerk.phone || "No phone listed"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="privacy" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={privacyHtml} onChange={(event) => setPrivacyHtml(event.target.value)} className="min-h-[220px]" />
              <Button onClick={handlePolicySave} disabled={isPolicySaving}>{isPolicySaving ? "Saving..." : "Save Policy"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{getInitials(profile?.name || "A")}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-semibold">{profile?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  handleAvatarUpload(file);
                }}
              />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="profile-name">Name</Label>
                  <Input
                    id="profile-name"
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="profile-district">District</Label>
                  <Input
                    id="profile-district"
                    value={profileForm.district}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, district: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleProfileSave} disabled={isProfileSaving}>{isProfileSaving ? "Saving..." : "Save Profile"}</Button>
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedApp ? `Review ${selectedApp.applicationId}` : "Review Application"}</DialogTitle>
            <DialogDescription>Inspect application details and choose an action.</DialogDescription>
          </DialogHeader>
          {selectedApp ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Citizen</p>
                    <p className="font-semibold">{selectedApp.fullName}</p>
                    <p className="text-sm text-muted-foreground">{selectedApp.cnic}</p>
                    <p className="text-sm text-muted-foreground mt-2">{selectedApp.district}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <div className="mt-2"><StatusBadge status={selectedApp.status as any} /></div>
                    <p className="text-sm text-muted-foreground mt-2">Updated: {formatDate(selectedApp.updatedAt)}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reviewDocuments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                  ) : reviewDocuments.map((doc) => (
                    <div key={doc.id || doc.publicId} className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div>
                        <p className="font-medium">{doc.label}</p>
                        <p className="text-sm text-muted-foreground">{doc.format || "file"}</p>
                      </div>
                      <a href={`/download/${doc.id || doc.publicId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open</a>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div>
                <Label htmlFor="reject-reason">Reason for rejection</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Leave a clear reason before rejecting."
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Close</Button>
            <Button onClick={() => selectedApp && handleApprove(selectedApp.id)} disabled={!selectedApp || isProcessingAction}>Approve</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!selectedApp || isProcessingAction}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
