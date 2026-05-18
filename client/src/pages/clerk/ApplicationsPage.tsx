import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { AJK_DISTRICTS } from "@/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, FileCheck2, Clock, CheckCircle, XCircle, Eye, Forward, FileText } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import type { Application } from "@/types";
import { toast } from "sonner";

export default function ClerkApplicationsPage() {
  const { user } = useAuth();
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      // Filter applications assigned to this clerk and submitted
      const clerkApps = res.applications.filter((app: Application) =>
        app.assignedClerkId === user?.id &&
        app.status !== "draft" &&
        app.district === user?.district
      );
      setApplications(clerkApps);
    } catch (err: any) {
      toast.error(err.message || "Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.district]);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [fetchApplications]);

  const filtered = applications.filter((app) => {
    const matchDistrict = districtFilter === "all" || app.district === districtFilter;
    const matchStatus = statusFilter === "all" || app.status === statusFilter;
    const matchSearch =
      !search ||
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.cnic.includes(search) ||
      app.applicationId.toLowerCase().includes(search.toLowerCase());
    return matchDistrict && matchStatus && matchSearch;
  });

  const handleReview = (app: Application) => {
    setSelected(app);
    setNewStatus(app.status);
    setRemarks(app.remarks || "");
  };

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return;
    setIsUpdating(true);
    try {
      await applicationApi.updateStatus(selected.id, newStatus as Application["status"], remarks);
      toast.success("Application status updated successfully.");
      setSelected(null);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Stats
  const pending = applications.filter((a) => a.status === "pending").length;
  const inReview = applications.filter((a) => a.status === "in_review").length;
  const verified = applications.filter((a) => a.status === "verified").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Applications</h1>
        <p className="text-muted-foreground mt-1">Manage and verify domicile applications assigned to you.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-full"><Clock className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Pending</p>
              <p className="text-2xl font-bold">{pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-500/10 p-3 rounded-full"><FileText className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">In Review</p>
              <p className="text-2xl font-bold">{inReview}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-500/10 p-3 rounded-full"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Verified</p>
              <p className="text-2xl font-bold">{verified}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-red-500/10 p-3 rounded-full"><XCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Rejected</p>
              <p className="text-2xl font-bold">{rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications table */}
      <Card className="border-border">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/10">
          <h3 className="text-lg font-bold">Application Queue</h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search CNIC, name or ID..."
                className="pl-9"
              />
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {AJK_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[140px]">App ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No applications found for the current filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map((app) => (
                <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-primary">{app.applicationId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getInitials(app.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{app.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{app.cnic}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{app.district}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(app.submittedAt)}</TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
                      onClick={() => handleReview(app)}
                    >
                      <Eye size={14} className="mr-1" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Application — {selected?.applicationId}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Applicant</p><p className="font-medium">{selected.fullName}</p></div>
                <div><p className="text-muted-foreground">CNIC</p><p className="font-mono">{selected.cnic}</p></div>
                <div><p className="text-muted-foreground">Father Name</p><p className="font-medium">{selected.fatherName}</p></div>
                <div><p className="text-muted-foreground">District</p><p className="font-medium">{selected.district}</p></div>
                <div><p className="text-muted-foreground">Date of Birth</p><p className="font-medium">{selected.dateOfBirth}</p></div>
                <div><p className="text-muted-foreground">Current Status</p><StatusBadge status={selected.status} /></div>
              </div>

              {selected.documents && selected.documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Uploaded Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.documents.map((doc: any, i: number) => (
                      <a key={i} href={doc.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-xs border rounded p-2 hover:bg-muted/50 text-primary">
                        <FileCheck2 className="w-3 h-3" /> {doc.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-1">Update Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="verified">Verified (Forward to Admin)</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {newStatus === "verified" && "After verifying, the application will be forwarded to admin for final approval."}
                  {newStatus === "rejected" && "Please provide a reason for rejection."}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Remarks</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks for the applicant or admin..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleUpdateStatus}
              disabled={isUpdating || !newStatus}
            >
              {isUpdating ? "Updating..." : newStatus === "verified" ? "Verify & Forward" : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}