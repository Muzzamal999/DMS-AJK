import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Activity } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Application } from "@/types";
import { toast } from "sonner";

export default function ClerkStatusTrackerPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      // Show applications this clerk has verified and forwarded to admin
      const forwardedApps = res.applications.filter((app: Application) =>
        app.assignedClerkId === user?.id &&
        ["verified", "approved", "rejected"].includes(app.status)
      );
      setApplications(forwardedApps);
    } catch (err: any) {
      toast.error(err.message || "Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [fetchApplications]);

  const filtered = applications.filter((app) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      app.applicationId.toLowerCase().includes(query) ||
      app.fullName.toLowerCase().includes(query) ||
      app.cnic.includes(query)
    );
  });

  // Stats
  const pendingAtAdmin = applications.filter((a) => a.status === "verified").length;
  const underReview = applications.filter((a) => a.status === "in_review").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Status Tracker</h1>
        <p className="text-muted-foreground mt-1">Track applications you have forwarded to admin.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-full"><Activity className="w-4 h-4 text-blue-600" /></div>
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase">Pending at Admin</p>
              <p className="text-xl font-bold text-blue-700">{pendingAtAdmin}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-full"><Activity className="w-4 h-4 text-amber-600" /></div>
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase">Under Review</p>
              <p className="text-xl font-bold text-amber-700">{underReview}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-full"><Activity className="w-4 h-4 text-green-600" /></div>
            <div>
              <p className="text-xs font-medium text-green-600 uppercase">Approved</p>
              <p className="text-xl font-bold text-green-700">{approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-full"><Activity className="w-4 h-4 text-red-600" /></div>
            <div>
              <p className="text-xs font-medium text-red-600 uppercase">Rejected</p>
              <p className="text-xl font-bold text-red-700">{rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Search by Application ID, Name or CNIC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>Citizen Name</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead>Date Forwarded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No forwarded applications found.
                </TableCell>
              </TableRow>
            ) : filtered.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-mono font-medium">{app.applicationId}</TableCell>
                <TableCell>{app.fullName}</TableCell>
                <TableCell className="font-mono">{app.cnic}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(app.submittedAt)}</TableCell>
                <TableCell><StatusBadge status={app.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {app.remarks || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}