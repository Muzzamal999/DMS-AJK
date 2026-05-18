import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Layers, Clock3, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import type { AdminStats, VolumeDataPoint, DistrictCount, StatusSummary } from "@/types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [districtData, setDistrictData] = useState<DistrictCount[]>([]);
  const [statusSummary, setStatusSummary] = useState<StatusSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, statusRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getApplicationStatus(),
      ]);

      setStats(dashboardRes.stats);
      setVolumeData(dashboardRes.volumeData);
      setDistrictData(dashboardRes.districtData);
      setStatusSummary(statusRes.statusSummary);
    } catch (err: any) {
      toast.error(err.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const dashboardCards = [
    { label: "Total Applications", value: stats?.totalApplications ?? 0, icon: <Layers className="w-5 h-5" />, color: "text-blue-600" },
    { label: "Pending", value: stats?.pendingVerification ?? 0, icon: <Clock3 className="w-5 h-5" />, color: "text-amber-600" },
    { label: "Approved", value: stats?.approvedCertificates ?? 0, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
    { label: "Rejected", value: stats?.rejectedFraudAlerts ?? 0, icon: <XCircle className="w-5 h-5" />, color: "text-red-600" },
  ];

  if (isLoading) {
    return (
      <AdminSidebar>
        <div className="space-y-6">
          <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-96 rounded-2xl bg-muted animate-pulse" />
            <div className="h-96 rounded-2xl bg-muted animate-pulse" />
          </div>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time overview of all applications</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Signed in as {user?.name}</span>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw size={14} className="mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
          {dashboardCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">{card.label}</span>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <div className="text-4xl font-bold">{card.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* District-wise Pie Chart */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>District-wise Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {districtData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No district data available</p>
              ) : (
                <div className="flex items-center justify-between">
                  {/* Pie Chart */}
                  <div className="relative">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      {(() => {
                        const total = districtData.reduce((sum, d) => sum + d.count, 0);
                        if (total === 0) return null;

                        let currentAngle = 0;
                        const radius = 80;
                        const cx = 100;
                        const cy = 100;

                        return districtData.map((district, i) => {
                          const percentage = total > 0 ? (district.count / total) * 100 : 0;
                          const angle = (percentage / 100) * 360;

                          if (percentage === 0) return null;

                          const startX = cx + radius * Math.cos((currentAngle * Math.PI) / 180);
                          const startY = cy + radius * Math.sin((currentAngle * Math.PI) / 180);
                          currentAngle += angle;
                          const endX = cx + radius * Math.cos(((currentAngle - 0.001) * Math.PI) / 180);
                          const endY = cy + radius * Math.sin(((currentAngle - 0.001) * Math.PI) / 180);

                          const largeArc = angle > 180 ? 1 : 0;

                          const pathD = [
                            `M ${cx} ${cy}`,
                            `L ${startX} ${startY}`,
                            `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
                            `Z`
                          ].join(" ");

                          const slice = (
                            <path
                              key={district.district}
                              d={pathD}
                              fill={district.color}
                              stroke="white"
                              strokeWidth="2"
                              className="transition-all hover:opacity-80 cursor-pointer"
                            />
                          );

                          return slice;
                        });
                      })()}
                      <circle cx="100" cy="100" r="40" fill="white" />
                      <text x="100" y="105" textAnchor="middle" className="text-xs font-semibold fill-foreground">
                        {districtData.reduce((sum, d) => sum + d.count, 0)}
                      </text>
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="space-y-2">
                    {districtData.map((district) => {
                      const total = districtData.reduce((sum, d) => sum + d.count, 0);
                      const percentage = total > 0 ? ((district.count / total) * 100).toFixed(1) : "0";
                      return (
                        <div key={district.district} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: district.color }}
                          />
                          <span className="font-medium">{district.district}</span>
                          <span className="text-muted-foreground ml-auto">
                            {district.count} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="mt-2 text-3xl font-semibold">{statusSummary?.completion ?? 0}%</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">In Review</p>
                <p className="mt-2 text-3xl font-semibold">{statusSummary?.inReview ?? 0}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="mt-2 text-3xl font-semibold">{statusSummary?.verified ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volume Data Over Week */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Application Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {volumeData.map((day) => (
                <div key={day.day} className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">{day.day}</p>
                  <div
                    className="mx-auto rounded-md bg-primary/20 hover:bg-primary/30 transition-colors"
                    style={{
                      height: `${Math.max(20, day.domestic * 4)}px`,
                      minHeight: "20px",
                      maxHeight: "100px",
                    }}
                  />
                  <p className="text-xs font-medium mt-2">{day.domestic}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
}