export const AJK_DISTRICTS = [
  "Muzaffarabad",
  "Mirpur",
  "Rawalakot",
  "Bagh",
  "Kotli",
  "Neelum",
  "Haveli",
  "Hattian",
  "Jhelum Valley",
  "Sudhnuti",
] as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY: "/verify",
  DASHBOARD: "/dashboard",
  APPLY: "/apply",
  APPLICATIONS: "/applications",
  NOTIFICATIONS: "/notifications",
  CLERK: "/clerk",
  ADMIN: "/admin",
} as const;

export const STATUS_CONFIG = {
  pending:   { label: "Pending",   className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_review: { label: "In Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  verified:  { label: "Verified",  className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  approved:  { label: "Approved",  className: "bg-green-50 text-green-700 border-green-200" },
  rejected:  { label: "Rejected",  className: "bg-red-50 text-red-700 border-red-200" },
  success:   { label: "Success",   className: "bg-green-50 text-green-700 border-green-200" },
  denied:    { label: "Denied",    className: "bg-red-50 text-red-700 border-red-200" },
} as const;

export const DEMO_CREDENTIALS = [
  { role: "citizen" as const, email: "citizen@ajk.gov.pk", password: "pass123", hint: "Citizen" },
  { role: "clerk"   as const, email: "clerk@ajk.gov.pk",   password: "pass123", hint: "Clerk"   },
  { role: "admin"   as const, email: "admin@ajk.gov.pk",   password: "pass123", hint: "Admin"   },
];

export const APP_NAME = "DMS AJ&K";
export const APP_FULL_NAME = "Domicile Management System — Azad Jammu & Kashmir";
export const COPYRIGHT = "© 2024 Government of Azad Jammu & Kashmir. All Rights Reserved.";
