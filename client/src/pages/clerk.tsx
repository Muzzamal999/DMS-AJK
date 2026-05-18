import { useState } from "react";
import { useApplications } from "@/hooks/useApplications";
import { adminApi } from "@/lib/api";
import { AJK_DISTRICTS } from "@/constants";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Search, Filter, FileCheck2, Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import type { Application } from "@/types";
import { toast } from "sonner";

export default function ClerkDashboard() {
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { applications, isLoading, updateStatus } = useApplications();
  const [selected, setSelected] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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
      await updateStatus(selected.id, newStatus as Application["status"], remarks);
      toast.success("Application status updated.");
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const pending = applications.filter((a) => a.status === "pending").length;
  const verifiedToday = applications.filter(
    (a) => a.status === "verified" && new Date(a.updatedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clerk Workstation</h1>
          <p className="text-muted-foreground mt-1">Manage and verify domicile applications in your queue.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Pending Queue",   value: pending,       icon: FileCheck2, color: "bg-primary/10 text-primary" },
            { label: "Verified Today",  value: verifiedToday, icon: Users,      color: "bg-green-500/10 text-green-600" },
            { label: "Total in System", value: applications.length, icon: Clock, color: "bg-amber-500/10 text-amber-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`${color} p-4 rounded-full`}><Icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applications table */}
        <Card className="border-border">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/10">
            <h3 className="text-lg font-bold">Application Queue</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search CNIC, name or ID..." className="pl-9" />
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
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

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
                <div><p className="text-muted-foreground">District</p><p className="font-medium">{selected.district}</p></div>
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
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Remarks (optional)</label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks for the applicant..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
