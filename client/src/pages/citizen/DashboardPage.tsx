import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock3, CheckCircle, XCircle, Plus, Search, Upload, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import type { Application } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      // Filter only this citizen's applications
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

  // Calculate stats
  const totalApps = applications.length;
  const pendingApps = applications.filter((a) => a.status === "pending" || a.status === "in_review").length;
  const processingApps = applications.filter((a) => a.status === "verified" || a.status === "forwarded_to_admin").length;
  const approvedApps = applications.filter((a) => a.status === "approved").length;
  const rejectedApps = applications.filter((a) => a.status === "rejected").length;
  const latestApp = applications[0];

  const statsCards = [
    { label: "Total Applications", value: totalApps, icon: <FileText className="w-5 h-5" />, color: "text-blue-600" },
    { label: "Pending", value: pendingApps, icon: <Clock3 className="w-5 h-5" />, color: "text-amber-600" },
    { label: "Under Processing", value: processingApps, icon: <FileText className="w-5 h-5" />, color: "text-indigo-600" },
    { label: "Approved", value: approvedApps, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
    { label: "Rejected", value: rejectedApps, icon: <XCircle className="w-5 h-5" />, color: "text-red-600" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's your application summary</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchApplications}>
            <RefreshCw size={14} className="mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setLocation("/apply")}>
            <Plus size={14} className="mr-2" /> Apply for Certificate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-sm font-medium">{stat.label}</span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="text-4xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest Application Status */}
      {latestApp && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Application ID</p>
                <p className="font-mono font-medium">{latestApp.applicationId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={latestApp.status as any} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">{formatDate(latestApp.submittedAt)}</p>
              </div>
              {latestApp.certificateNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Certificate #</p>
                  <p className="font-mono font-medium">{latestApp.certificateNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/apply")}
            >
              <Plus size={16} className="mr-2" /> Apply New Certificate
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/citizen/track")}
            >
              <Search size={16} className="mr-2" /> Track Application
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/citizen/documents")}
            >
              <Upload size={16} className="mr-2" /> Upload Documents
            </Button>
          </CardContent>
        </Card>

        {/* Application Timeline */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Application History</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No applications yet. Click "Apply New Certificate" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        app.status === "approved" ? "bg-green-500" :
                        app.status === "rejected" ? "bg-red-500" :
                        app.status === "in_review" ? "bg-amber-500" :
                        "bg-blue-500"
                      }`} />
                      <div>
                        <p className="font-medium">{app.applicationId}</p>
                        <p className="text-sm text-muted-foreground">{app.district}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={app.status as any} />
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(app.submittedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}