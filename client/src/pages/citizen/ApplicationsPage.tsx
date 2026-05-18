import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, RefreshCw, Eye, Download, XCircle } from "lucide-react";
import type { Application } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function CitizenApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      const myApps = res.applications.filter((app) => app.userId === user?.id);
      setApplications(myApps);
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
  }, [fetchApplications, user?.id]);

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.applicationId.toLowerCase().includes(query) ||
      app.status.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">View all your submitted applications</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchApplications}>
            <RefreshCw size={14} className="mr-2" /> Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by Application ID or Status..."
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
                <TableHead>District</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Certificate #</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {isLoading ? "Loading..." : "No applications found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredApps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono font-medium">{app.applicationId}</TableCell>
                    <TableCell>{app.district}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(app.submittedAt)}</TableCell>
                    <TableCell><StatusBadge status={app.status as any} /></TableCell>
                    <TableCell className="font-mono text-sm">{app.certificateNumber || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedApp(app)}>
                          <Eye size={14} className="mr-1" /> View
                        </Button>
                        {app.certificateNumber && (
                          <Button size="sm" variant="outline" onClick={() => applicationApi.downloadCertificate(app.id)}>
                            <Download size={14} className="mr-1" /> Receipt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details: {selectedApp?.applicationId}</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedApp.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Father Name</p>
                  <p className="font-medium">{selectedApp.fatherName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CNIC</p>
                  <p className="font-medium">{selectedApp.cnic}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{selectedApp.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">District</p>
                  <p className="font-medium">{selectedApp.district}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <StatusBadge status={selectedApp.status as any} />
                </div>
              </div>
              {selectedApp.remarks && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Remarks</p>
                  <p className="text-sm">{selectedApp.remarks}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm">{formatDate(selectedApp.submittedAt)}</p>
                </div>
                {selectedApp.certificateNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Certificate #</p>
                    <p className="font-mono font-medium">{selectedApp.certificateNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}