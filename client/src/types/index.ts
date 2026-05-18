export type UserRole = "citizen" | "clerk" | "admin";

export type ApplicationStatus =
  | "pending"
  | "verified"
  | "in_review"
  | "approved"
  | "rejected";

export type AuditStatus = "success" | "pending" | "denied";

export type Gender = "male" | "female" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string | null;
  phone: string | null;
  avatarUrl: string | null;
  profileUpdatedAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  applicationId: string;
  userId: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  dateOfBirth: string;
  gender: Gender;
  district: string;
  currentAddress: string;
  permanentAddress: string;
  status: ApplicationStatus;
  remarks: string | null;
  documents: Document[];
  submittedAt: string;
  updatedAt: string;
  certificateNumber: string | null;
  issuedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  description: string;
  detail: string;
  timeAgo: string;
  icon: string;
}

export interface AuditLog {
  id: string;
  user: string;
  userInitials: string;
  action: string;
  resource: string;
  timestamp: string;
  status: AuditStatus;
}

export interface VolumeDataPoint {
  day: string;
  domestic: number;
  overseas: number;
}

export interface DistrictCount {
  district: string;
  count: number;
  color: string;
}

export interface SystemHealth {
  cpuLoad: number;
  memoryUsed: number;
  memoryTotal: number;
  apiResponseMs: number;
  status: string;
}

export interface AdminStats {
  totalApplications: number;
  pendingVerification: number;
  approvedCertificates: number;
  rejectedFraudAlerts: number;
  systemHealth: SystemHealth;
}

export interface ClerkStats {
  assignedToMe: number;
  verifiedToday: number;
  avgProcessingHours: number;
}

export interface StatusSummary {
  pending: number;
  verified: number;
  inReview: number;
  approved: number;
  rejected: number;
  completion: number;
}

export interface AdminApplication extends Application {
  reviewedBy: string | null;
}

export interface DocumentStatusEntry {
  label: string;
  present: boolean;
}

export interface DocumentWallet {
  citizen: {
    id: string;
    name: string;
    cnic: string;
    district: string;
  };
  documents: Document[];
  documentStatus: DocumentStatusEntry[];
}

export interface StatusTrackerLog {
  id: string;
  citizenName: string;
  cnic: string;
  district: string;
  ipAddress: string;
  time: string;
  eventType: string;
}

export interface SupportClerk {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  district: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

export interface ApplicationJourney {
  submitted: string | null;
  verified: string | null;
  inReview: boolean;
  issued: string | null;
  applicationRef: string | null;
}

export interface DashboardSummary {
  currentStatus: string;
  applicationId: string | null;
  certificatesIssued: number;
  notificationCount: number;
  applicationJourney: ApplicationJourney;
  recentActivity: ActivityItem[];
}

export interface VerificationResult {
  valid: boolean;
  certificateNumber: string;
  fullNameMasked: string | null;
  district: string | null;
  issueDate: string | null;
  status: string | null;
}

export interface ApplicationFormData {
  fullName: string;
  fatherName: string;
  cnic: string;
  dateOfBirth: string;
  gender: Gender;
  district: string;
  currentAddress: string;
  permanentAddress: string;
  sameAsCurrent?: boolean;
}

export interface Document {
  id?: string;
  label: string;
  url: string;
  publicId: string;
  format?: string;
  uploadedAt?: string;
}
