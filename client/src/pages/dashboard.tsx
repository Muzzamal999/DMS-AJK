import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useApplications } from "@/hooks/useApplications";
import { applicationApi } from "@/lib/api";
import type { DashboardSummary } from "@/types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FilePlus, Download, HeadphonesIcon, Clock, FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const { applications } = useApplications(user?.id);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "citizen") {
      applicationApi.getDashboard()
        .then((res) => setSummary(res.summary))
        .catch(() => setSummary(null))
        .finally(() => setSummaryLoading(false));
    } else {
      setSummaryLoading(false);
    }
  }, [user]);

  const latestApp = applications[0] ?? null;
  const issuedCount = applications.filter((a) => a.status === "approved").length;

  const getStatusColor = (status?: string) => {
    if (!status) return "text-muted-foreground";
    if (status.includes("review") || status.includes("pending")) return "text-amber-600";
    if (status.includes("approve") || status.includes("issued")) return "text-green-600";
    if (status.includes("reject")) return "text-destructive";
    return "text-blue-600";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {user?.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here is the status of your domicile applications.
            </p>
          </div>
          <Link href="/apply">
            <Button className="bg-primary hover:bg-primary/90">
              <FilePlus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold capitalize ${getStatusColor(latestApp?.status ?? "")}`}>
                {latestApp ? latestApp.status.replace("_", " ") : "No Active Application"}
              </p>
              {latestApp && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">Ref: {latestApp.applicationId}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Certificates Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{issuedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Available in Document Vault</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Unread Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
              <Link href="/notifications" className="text-xs text-primary hover:underline mt-1 inline-block">
                View all notifications &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Journey timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Journey</CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : summary?.applicationJourney?.applicationRef ? (
                  <div className="relative border-l-2 border-muted ml-3 space-y-8 py-2">
                    {[
                      {
                        label: "Application Submitted",
                        done: !!summary.applicationJourney.submitted,
                        date: formatDate(summary.applicationJourney.submitted),
                        color: "bg-primary",
                      },
                      {
                        label: "Documents Verified",
                        done: !!summary.applicationJourney.verified,
                        date: formatDate(summary.applicationJourney.verified),
                        color: "bg-primary",
                      },
                      {
                        label: "Under Official Review",
                        done: summary.applicationJourney.inReview,
                        date: summary.applicationJourney.inReview ? "Currently being processed" : undefined,
                        color: "bg-amber-500",
                        dateClass: "text-amber-600",
                      },
                      {
                        label: "Certificate Issued",
                        done: !!summary.applicationJourney.issued,
                        date: formatDate(summary.applicationJourney.issued),
                        color: "bg-green-500",
                      },
                    ].map(({ label, done, date, color, dateClass }) => (
                      <div key={label} className="relative pl-6">
                        <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-background ${done ? color : "bg-muted"}`} />
                        <h4 className={`font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</h4>
                        {done && date && (
                          <p className={`text-xs mt-1 ${dateClass ?? "text-muted-foreground"}`}>{date}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No active applications found.</p>
                    <Link href="/apply">
                      <Button variant="link" className="text-primary mt-2">Start a new application</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : summary?.recentActivity && summary.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {summary.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="bg-muted p-2 rounded-full text-primary mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.detail}</p>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(activity.timeAgo)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-sm">No recent activity.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions + policy card */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/apply">
                  <Button variant="outline" className="w-full justify-start h-12 border-border hover:bg-muted/50">
                    <FilePlus className="w-4 h-4 mr-3 text-primary" />
                    Start New Application
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-border hover:bg-muted/50"
                  disabled={issuedCount === 0}
                >
                  <Download className="w-4 h-4 mr-3 text-primary" />
                  Download Certificate
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 border-border hover:bg-muted/50">
                  <HeadphonesIcon className="w-4 h-4 mr-3 text-primary" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-32 bg-primary relative">
                <img src="/hero-mountain.png" alt="AJK" className="w-full h-full object-cover opacity-50" />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-bold text-lg mb-2">Legal Guidelines</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ensure all uploaded documents are authentic. Providing false information is a punishable offense under AJ&K law.
                </p>
                <Button variant="link" className="px-0 text-primary">Read Full Policy &rarr;</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
