import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, Eye, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import type { AdminApplication } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getApplications({ forwarded: "true", status: "all" });
      setApplications(res.applications as AdminApplication[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleReview = (app: AdminApplication) => {
    setSelectedApp(app);
    setIsReviewOpen(true);
  };

  const handleApprove = async (appId: string) => {
    setIsProcessing(true);
    try {
      await adminApi.approveApplication(appId);
      toast.success("Application approved successfully.");
      setIsReviewOpen(false);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve application.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a reason for rejection.");
      return;
    }
    setIsProcessing(true);
    try {
      await adminApi.rejectApplication(selectedApp.id, rejectReason.trim());
      toast.success("Application rejected.");
      setRejectReason("");
      setIsReviewOpen(false);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject application.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.fullName.toLowerCase().includes(query) ||
      app.cnic.toLowerCase().includes(query) ||
      app.applicationId.toLowerCase().includes(query)
    );
  });

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">Applications forwarded by clerks for your review</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchApplications}>
            <RefreshCw size={14} className="mr-2" /> Reload
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by name, CNIC, or application ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Applications Table */}
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Citizen Name</TableHead>
                <TableHead>CNIC</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {isLoading ? "Loading..." : "No forwarded applications found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredApps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-sm">{app.applicationId}</TableCell>
                    <TableCell className="font-medium">{app.fullName}</TableCell>
                    <TableCell>{app.cnic}</TableCell>
                    <TableCell>{app.district}</TableCell>
                    <TableCell><StatusBadge status={app.status as any} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(app.submittedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleReview(app)}>
                          <Eye size={14} className="mr-1" /> Review
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(app.id)} disabled={isProcessing}>
                          <CheckCircle size={14} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReview(app)}>
                          <XCircle size={14} className="mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Application: {selectedApp?.applicationId}</DialogTitle>
            <DialogDescription>Review the application details and documents before approving or rejecting.</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedApp.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Father Name:</span>
                      <span className="font-medium">{selectedApp.fatherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CNIC:</span>
                      <span className="font-medium">{selectedApp.cnic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <span className="font-medium">{selectedApp.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="font-medium">{selectedApp.gender}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Location & Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">District:</span>
                      <span className="font-medium">{selectedApp.district}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Address:</span>
                      <span className="font-medium">{selectedApp.currentAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Permanent Address:</span>
                      <span className="font-medium">{selectedApp.permanentAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={selectedApp.status as any} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedApp.documents && selectedApp.documents.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedApp.documents.map((doc) => (
                        <div key={doc.id || doc.publicId} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">{doc.label}</p>
                            <p className="text-xs text-muted-foreground">{doc.format}</p>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-primary hover:bg-primary/10 rounded"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                  )}
                </CardContent>
              </Card>

              {/* Rejection Reason */}
              <div>
                <Label htmlFor="reject-reason">Reason for Rejection (required for rejection)</Label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  className="w-full mt-2 p-3 rounded-lg border bg-background text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => selectedApp && handleApprove(selectedApp.id)} disabled={isProcessing}>
              <CheckCircle size={14} className="mr-2" /> Approve
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectReason.trim()}>
              <XCircle size={14} className="mr-2" /> Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSidebar>
  );
}