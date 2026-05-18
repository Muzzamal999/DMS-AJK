import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText, CheckCircle, XCircle, Clock, FolderOpen,
  Search, Download, Eye, ExternalLink, User
} from "lucide-react";
import type { Application } from "@/types";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getInitials, formatDate } from "@/lib/utils";

export default function ClerkDocumentWalletPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      const clerkApps = res.applications.filter((app: Application) =>
        app.status !== "draft"
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

  // Collect all documents from all applications
  const allDocuments = applications.flatMap((app) =>
    (app.documents || []).map((doc: any) => ({
      ...doc,
      applicationId: app.applicationId,
      citizenName: app.fullName,
      cnic: app.cnic,
      district: app.district,
      status: app.status,
      submittedAt: app.submittedAt,
    }))
  );

  const filteredDocs = allDocuments.filter((doc) =>
    !search ||
    doc.citizenName?.toLowerCase().includes(search.toLowerCase()) ||
    doc.applicationId?.toLowerCase().includes(search.toLowerCase()) ||
    doc.cnic?.includes(search) ||
    doc.label?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalProcessed = applications.filter((a) => ["verified", "approved", "rejected"].includes(a.status)).length;
  const verifiedAndForwarded = applications.filter((a) => a.status === "verified" || a.status === "forwarded_to_admin").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const pending = applications.filter((a) => a.status === "pending" || a.status === "in_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Document Wallet</h1>
        <p className="text-muted-foreground mt-1">Access and manage all citizen documents from submitted applications.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full"><FileText className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Documents</p>
              <h3 className="text-3xl font-bold mt-1">{allDocuments.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-amber-500/10 p-4 rounded-full"><Clock className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Review</p>
              <h3 className="text-3xl font-bold mt-1">{pending}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-green-500/10 p-4 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Verified</p>
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
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Search by name, CNIC, application ID, or document type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Document Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderOpen size={18} /> All Documents ({filteredDocs.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mt-4">No documents found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc: any, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  {/* Citizen Info */}
                  <div className="flex items-center gap-3 pb-3 border-b mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(doc.citizenName || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.citizenName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{doc.cnic}</p>
                    </div>
                  </div>

                  {/* Document Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{doc.label}</Badge>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p><strong>App ID:</strong> <span className="font-mono">{doc.applicationId}</span></p>
                      <p><strong>District:</strong> {doc.district}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedDoc(doc)}>
                      <Eye size={12} className="mr-1" /> View
                    </Button>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-3 py-1.5 text-xs border rounded hover:bg-muted/50">
                      <Download size={12} className="mr-1" /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Document Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(o) => !o && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedDoc?.label}</span>
              <Badge variant="outline" className="font-mono">{selectedDoc?.applicationId}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(selectedDoc?.citizenName || "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedDoc?.citizenName}</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedDoc?.cnic}</p>
              </div>
              <div className="ml-auto text-right text-xs text-muted-foreground">
                <p><strong>District:</strong> {selectedDoc?.district}</p>
                <p><strong>Submitted:</strong> {formatDate(selectedDoc?.submittedAt)}</p>
              </div>
            </div>
            <div className="flex justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]">
              {selectedDoc?.format?.startsWith("image/") ? (
                <img src={selectedDoc?.url} alt={selectedDoc?.label} className="max-w-full max-h-[500px] object-contain" />
              ) : (
                <iframe src={selectedDoc?.url} className="w-full h-[500px]" title={selectedDoc?.label} />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <a href={selectedDoc?.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-4 py-2 text-sm border rounded hover:bg-muted/50">
              <ExternalLink size={14} className="mr-2" /> Open in New Tab
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}