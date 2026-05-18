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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search, Filter, FileCheck2, Clock, CheckCircle, XCircle,
  Eye, FileText, Download, ExternalLink, User
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import type { Application } from "@/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  const [viewDoc, setViewDoc] = useState<any>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      // Clerks see all non-draft applications
      const clerkApps = res.applications.filter((app: Application) =>
        app.status !== "draft"
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
      app.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      app.cnic?.includes(search) ||
      app.applicationId?.toLowerCase().includes(search.toLowerCase()) ||
      (app as any).citizenName?.toLowerCase().includes(search.toLowerCase());
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
      await applicationApi.updateStatus(selected.id, { status: newStatus, remarks });
      toast.success("Application status updated successfully.");
      setSelected(null);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForwardToAdmin = async () => {
    if (!selected) return;
    setNewStatus("forwarded_to_admin");
    setIsUpdating(true);
    try {
      await applicationApi.updateStatus(selected.id, { status: "forwarded_to_admin", remarks: remarks || "Forwarded to Admin for final approval" });
      toast.success("Application forwarded to Admin.");
      setSelected(null);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || "Failed to forward application.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Stats
  const pending = applications.filter((a) => a.status === "pending").length;
  const inReview = applications.filter((a) => a.status === "in_review").length;
  const verified = applications.filter((a) => a.status === "verified").length;
  const forwarded = applications.filter((a) => a.status === "forwarded_to_admin").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Application Processing</h1>
        <p className="text-muted-foreground mt-1">Review and manage citizen domicile applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <p className="text-xs font-medium text-muted-foreground uppercase">Under Review</p>
              <p className="text-2xl font-bold">{inReview}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-indigo-500/10 p-3 rounded-full"><CheckCircle className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Verified</p>
              <p className="text-2xl font-bold">{verified}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-purple-500/10 p-3 rounded-full"><ExternalLink className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Forwarded</p>
              <p className="text-2xl font-bold">{forwarded}</p>
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
          <h3 className="text-lg font-bold">Application Queue ({filtered.length})</h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, CNIC, or ID..."
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
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">Under Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="forwarded_to_admin">Forwarded</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
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
                          {getInitials(app.fullName || "U")}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Application
              <Badge variant="outline" className="font-mono">{selected?.applicationId}</Badge>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {/* Applicant Info Card */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {getInitials(selected.fullName || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{selected.fullName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User size={14} /> Citizen • {selected.district}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Father Name</p>
                    <p className="font-medium">{selected.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CNIC</p>
                    <p className="font-mono font-medium">{selected.cnic}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{selected.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{selected.gender}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Current Address</p>
                    <p className="font-medium">{selected.currentAddress}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Permanent Address</p>
                    <p className="font-medium">{selected.permanentAddress}</p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              {selected.documents && selected.documents.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Uploaded Documents ({selected.documents.length})</Label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {selected.documents.map((doc: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileCheck2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">{doc.label}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{doc.format?.split("/")[1]?.toUpperCase() || "FILE"}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewDoc(doc)}>
                            <Eye size={12} className="mr-1" /> View
                          </Button>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-3 py-1.5 text-xs border rounded hover:bg-muted/50">
                            <Download size={12} className="mr-1" /> Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Section */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Update Application Status</Label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={newStatus === "in_review" ? "default" : "outline"}
                    onClick={() => setNewStatus("in_review")}
                    className={newStatus === "in_review" ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    <Clock size={14} className="mr-1" /> Under Review
                  </Button>
                  <Button
                    size="sm"
                    variant={newStatus === "verified" ? "default" : "outline"}
                    onClick={() => setNewStatus("verified")}
                    className={newStatus === "verified" ? "bg-indigo-500 hover:bg-indigo-600" : ""}
                  >
                    <CheckCircle size={14} className="mr-1" /> Verified
                  </Button>
                  <Button
                    size="sm"
                    variant={newStatus === "forwarded_to_admin" ? "default" : "outline"}
                    onClick={() => setNewStatus("forwarded_to_admin")}
                    className={newStatus === "forwarded_to_admin" ? "bg-purple-500 hover:bg-purple-600" : ""}
                  >
                    <ExternalLink size={14} className="mr-1" /> Forward to Admin
                  </Button>
                  <Button
                    size="sm"
                    variant={newStatus === "rejected" ? "default" : "outline"}
                    onClick={() => setNewStatus("rejected")}
                    className={newStatus === "rejected" ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <XCircle size={14} className="mr-1" /> Reject
                  </Button>
                </div>
                {newStatus === "forwarded_to_admin" && (
                  <p className="text-xs text-purple-600 mb-2 bg-purple-50 p-2 rounded">
                    Verified applications will be forwarded to Admin for final approval.
                  </p>
                )}
                {newStatus === "rejected" && (
                  <p className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded">
                    Please provide a reason for rejection in the remarks section below.
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div>
                <Label>Clerk Remarks / Comments</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks for the applicant or admin..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleUpdateStatus}
              disabled={isUpdating || !newStatus}
              className={newStatus === "rejected" ? "bg-red-500" : ""}
            >
              {isUpdating ? "Updating..." : newStatus === "rejected" ? "Reject Application" : "Update Status"}
            </Button>
            {(newStatus === "verified" || newStatus === "forwarded_to_admin") && (
              <Button
                className="bg-purple-500 hover:bg-purple-600"
                onClick={handleUpdateStatus}
                disabled={isUpdating}
              >
                <ExternalLink size={14} className="mr-1" /> Forward to Admin
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewDoc?.label}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]">
            {viewDoc?.format?.startsWith("image/") ? (
              <img src={viewDoc.url} alt={viewDoc.label} className="max-w-full max-h-[500px] object-contain" />
            ) : (
              <iframe src={viewDoc?.url} className="w-full h-[500px]" title={viewDoc?.label} />
            )}
          </div>
          <DialogFooter>
            <a href={viewDoc?.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-4 py-2 text-sm border rounded hover:bg-muted/50">
              <ExternalLink size={14} className="mr-2" /> Open in New Tab
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}