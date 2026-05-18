import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",            className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_review: { label: "Under Review",        className: "bg-amber-50 text-amber-700 border-amber-200" },
  verified:  { label: "Verified",           className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  forwarded_to_admin: { label: "Forwarded", className: "bg-purple-50 text-purple-700 border-purple-200" },
  approved:  { label: "Approved",           className: "bg-green-50 text-green-700 border-green-200" },
  rejected:  { label: "Rejected",           className: "bg-red-50 text-red-700 border-red-200" },
  success:   { label: "Success",             className: "bg-green-50 text-green-700 border-green-200" },
  denied:    { label: "Denied",              className: "bg-red-50 text-red-700 border-red-200" },
  draft:     { label: "Draft",               className: "bg-gray-50 text-gray-700 border-gray-200" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className} data-testid={`status-badge-${status}`}>
      {config.label}
    </Badge>
  );
}