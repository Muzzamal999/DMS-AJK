import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Filter, Calendar, MapPin } from "lucide-react";
import type { StatusTrackerLog, AuditLog } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminStatusTrackerPage() {
  const [trackerLogs, setTrackerLogs] = useState<StatusTrackerLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.district) params.district = filters.district;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [trackerRes, auditRes] = await Promise.all([
        adminApi.getStatusTracker(params),
        adminApi.getRecentAudits(),
      ]);

      setTrackerLogs(trackerRes.logs);
      setAuditLogs(auditRes.auditLogs);
    } catch (err: any) {
      toast.error(err.message || "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Status Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">Track citizen status checks and view audit logs</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw size={14} className="mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Audit Log */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Recent Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No audit logs available</p>
              ) : (
                auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.resource}</p>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{log.timestamp}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Status Tracker Logs */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Citizen Status Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <MapPin size={12} /> District
                  </Label>
                  <Input
                    placeholder="All districts"
                    value={filters.district}
                    onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Calendar size={12} /> From Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Calendar size={12} /> To Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={fetchData} className="w-full">
                <Filter size={14} className="mr-2" /> Apply Filters
              </Button>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Citizen Name</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trackerLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {isLoading ? "Loading..." : "No tracking records found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      trackerLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.citizenName || "N/A"}</TableCell>
                          <TableCell>{log.cnic || "N/A"}</TableCell>
                          <TableCell>{log.district || "N/A"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(log.time)}</TableCell>
                          <TableCell className="text-sm font-muted-foreground">{log.ipAddress}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
}