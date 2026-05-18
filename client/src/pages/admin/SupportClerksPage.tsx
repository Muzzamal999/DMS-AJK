import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Mail, Phone, Trash2 } from "lucide-react";
import type { SupportClerk } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSupportClerksPage() {
  const { user } = useAuth();
  const [clerks, setClerks] = useState<SupportClerk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClerk, setNewClerk] = useState({ name: "", email: "", phone: "", district: "" });

  const fetchClerks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getSupportClerks();
      setClerks(res.clerks);
    } catch (err: any) {
      toast.error(err.message || "Failed to load support clerks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClerks();
  }, [fetchClerks]);

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Support Clerks</h1>
              <p className="text-sm text-muted-foreground">Manage district-wise support staff</p>
            </div>
          </div>
        </div>

        {/* Clerks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clerks by District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clerks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {isLoading ? "Loading..." : "No support clerks found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    clerks.map((clerk) => (
                      <TableRow key={clerk.id}>
                        <TableCell className="font-medium">{clerk.name}</TableCell>
                        <TableCell>{clerk.email}</TableCell>
                        <TableCell>{clerk.phone || "N/A"}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {clerk.district || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendEmail(clerk.email)}
                            >
                              <Mail size={14} className="mr-1" /> Email
                            </Button>
                            {clerk.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCall(clerk.phone)}
                              >
                                <Phone size={14} className="mr-1" /> Call
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
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Support clerks are registered users with the "clerk" role.
              Their contact information is synced from the admin profile settings.
              To add or remove clerks, contact the system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
}