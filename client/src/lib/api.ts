// Central API configuration and helper
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("dms_auth_token");
    return stored;
  } catch {
    return null;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API request failed");
  }
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { name: string; email: string; password: string; cnic?: string; role: string }) =>
    apiRequest<{ success: boolean; token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string; role: string }) =>
    apiRequest<{ success: boolean; token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMe: () => apiRequest<{ success: boolean; user: User }>("/auth/me"),

  updateMe: (body: { name?: string; district?: string; phone?: string; avatarUrl?: string }) =>
    apiRequest<{ success: boolean; user: User }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ success: boolean; message: string }>("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationApi = {
  create: (formData: FormData) =>
    apiRequest<{ success: boolean; application: Application }>("/applications", {
      method: "POST",
      body: formData,
    }),

  saveDraft: (formData: FormData) =>
    apiRequest<{ success: boolean; application: Application }>("/applications/draft", {
      method: "PUT",
      body: formData,
    }),

  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest<{
      success: boolean;
      applications: Application[];
      total: number;
      pages: number;
    }>(`/applications${query}`);
  },

  get: (id: string) =>
    apiRequest<{ success: boolean; application: Application }>(`/applications/${id}`),

  updateStatus: (id: string, body: { status: string; remarks?: string }) =>
    apiRequest<{ success: boolean; application: Application }>(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  uploadDocuments: (id: string, formData: FormData) =>
    apiRequest<{ success: boolean; documents: Document[] }>(`/applications/${id}/documents`, {
      method: "POST",
      body: formData,
    }),

  verifyCertificate: (certificateNumber: string) =>
    apiRequest<VerificationResult>(`/applications/verify/${certificateNumber}`),

  getDashboard: () =>
    apiRequest<{ success: boolean; summary: DashboardSummary }>("/applications/dashboard"),

  downloadCertificate: async (id: string): Promise<void> => {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${BASE_URL}/applications/${id}/certificate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Download failed" }));
      throw new Error(error.message || "Download failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  list: () =>
    apiRequest<{ success: boolean; notifications: Notification[] }>("/notifications"),

  markRead: (id: string) =>
    apiRequest<{ success: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    apiRequest<{ success: boolean }>("/notifications/mark-all-read", { method: "PATCH" }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () =>
    apiRequest<{
      success: boolean;
      stats: AdminStats;
      volumeData: VolumeDataPoint[];
      districtData: DistrictCount[];
      auditLogs: AuditLog[];
    }>("/admin/stats"),

  getDashboardStats: () =>
    apiRequest<{
      success: boolean;
      stats: AdminStats;
      volumeData: VolumeDataPoint[];
      districtData: DistrictCount[];
      auditLogs: AuditLog[];
      applicationStatus: StatusSummary;
    }>("/admin/dashboard-stats"),

  getRecentAudits: () =>
    apiRequest<{ success: boolean; auditLogs: AuditLog[] }>("/admin/recent-audits"),

  getApplicationStatus: () =>
    apiRequest<{ success: boolean; statusSummary: StatusSummary }>("/admin/application-status"),

  getApplications: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest<{
      success: boolean;
      applications: Application[];
      total: number;
      page: number;
      pages: number;
    }>(`/admin/applications${query}`);
  },

  approveApplication: (id: string, remarks?: string) =>
    apiRequest<{ success: boolean; application: Application }>(`/admin/application/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),

  rejectApplication: (id: string, reason: string) =>
    apiRequest<{ success: boolean; application: Application }>(`/admin/application/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getDocumentWallet: (citizenId: string) =>
    apiRequest<{ success: boolean; citizen: { id: string; name: string; cnic: string; district: string }; documents: Document[]; documentStatus: DocumentStatusEntry[] }>(`/admin/document-wallet/${citizenId}`),

  getStatusTracker: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest<{
      success: boolean;
      logs: StatusTrackerLog[];
      total: number;
      page: number;
      pages: number;
    }>(`/admin/status-tracker${query}`);
  },

  getSupportClerks: () =>
    apiRequest<{ success: boolean; clerks: SupportClerk[] }>("/admin/support-clerks"),

  getPrivacyPolicy: () =>
    apiRequest<{ success: boolean; html: string }>("/admin/privacy-policy"),

  updatePrivacyPolicy: (html: string) =>
    apiRequest<{ success: boolean; html: string }>("/admin/privacy-policy", {
      method: "POST",
      body: JSON.stringify({ html }),
    }),

  getProfile: () =>
    apiRequest<{ success: boolean; profile: Profile }>("/admin/profile"),

  updateProfile: (body: { name: string; district: string; phone: string }) =>
    apiRequest<{ success: boolean; profile: Profile }>("/admin/profile/update", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  uploadAvatar: (formData: FormData) =>
    apiRequest<{ success: boolean; avatarUrl: string }>("/admin/profile/avatar", {
      method: "POST",
      body: formData,
    }),

  getUsers: () =>
    apiRequest<{ success: boolean; users: User[] }>("/admin/users"),
};

// ── Types re-export (mirrors backend responses) ───────────────────────────────
import type {
  User,
  Application,
  Notification,
  AdminStats,
  VolumeDataPoint,
  DistrictCount,
  AuditLog,
  ClerkStats,
  StatusSummary,
  Document,
  DocumentStatusEntry,
  StatusTrackerLog,
  SupportClerk,
  Profile,
  DashboardSummary,
  VerificationResult,
} from "@/types";