import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock, FolderOpen } from "lucide-react";
import type { Application } from "@/types";
import { toast } from "sonner";

export default function ClerkDocumentWalletPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      const clerkApps = res.applications.filter((app: Application) =>
        app.assignedClerkId === user?.id &&
        app.district === user?.district
      );
      setApplications(clerkApps);
    } catch (err: any) {
      toast.error(err.message || "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.district]);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [fetchApplications]);

  // Stats
  const totalProcessed = applications.filter((a) => ["verified", "approved", "rejected"].includes(a.status)).length;
  const verifiedAndForwarded = applications.filter((a) => a.status === "verified").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const pending = applications.filter((a) => a.status === "pending" || a.status === "in_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Document Wallet</h1>
        <p className="text-muted-foreground mt-1">Overview of processed applications and documents.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full"><FileText className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Processed</p>
              <h3 className="text-3xl font-bold mt-1">{totalProcessed}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-green-500/10 p-4 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Verified & Forwarded</p>
              <h3 className="text-3xl font-bold mt-1">{verifiedAndForwarded}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-red-500/10 p-4 rounded-full"><XCircle className="w-6 h-6 text-red-600" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rejected</p>
              <h3 className="text-3xl font-bold mt-1">{rejected}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-amber-500/10 p-4 rounded-full"><Clock className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
              <h3 className="text-3xl font-bold mt-1">{pending}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen size={18} /> How Document Processing Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>1. Pending:</strong> Applications assigned to you awaiting review.</p>
          <p><strong>2. In Review:</strong> You are currently reviewing the application and documents.</p>
          <p><strong>3. Verified:</strong> Documents verified and application forwarded to admin for final approval.</p>
          <p><strong>4. Rejected:</strong> Application rejected due to issues. Reason will be provided.</p>
        </CardContent>
      </Card>

      {/* Processing Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium">Pending</p>
              <p className="text-xs text-muted-foreground">{pending}</p>
            </div>
            <div className="flex-1 h-1 bg-border mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-sm font-medium">In Review</p>
              <p className="text-xs text-muted-foreground">
                {applications.filter((a) => a.status === "in_review").length}
              </p>
            </div>
            <div className="flex-1 h-1 bg-border mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">Verified</p>
              <p className="text-xs text-muted-foreground">{verifiedAndForwarded}</p>
            </div>
            <div className="flex-1 h-1 bg-border mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium">Admin Approved</p>
              <p className="text-xs text-muted-foreground">
                {applications.filter((a) => a.status === "approved").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}