import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FolderOpen, FileText, Upload, Eye, CheckCircle, Clock3, XCircle, Image, File } from "lucide-react";
import type { Application, Document } from "@/types";
import { formatDate } from "@/lib/utils";

// Match labels with document keys for upload
const REQUIRED_DOCS_MAP: Record<string, { key: string; label: string }> = {
  "CNIC Copy (Front)": { key: "cnic_front", label: "CNIC Copy (Front)" },
  "CNIC Copy (Back)": { key: "cnic_back", label: "CNIC Copy (Back)" },
  "Passport Size Photograph": { key: "photograph", label: "Passport Size Photograph" },
  "Proof of Residence": { key: "residence_proof", label: "Proof of Residence" },
};

const DOC_KEY_TO_LABEL: Record<string, string> = {
  cnic_front: "CNIC Copy (Front)",
  cnic_back: "CNIC Copy (Back)",
  photograph: "Passport Size Photograph",
  residence_proof: "Proof of Residence",
};

export default function CitizenDocumentsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);

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

  const getAppDocuments = (app: Application) => {
    const docMap: Record<string, Document> = {};
    app.documents?.forEach((doc) => {
      docMap[doc.label] = doc;
    });
    return docMap;
  };

  const getMissingDocs = (app: Application) => {
    const uploaded = getAppDocuments(app);
    return Object.values(REQUIRED_DOCS_MAP).filter(({ label }) => !uploaded[label]);
  };

  const handleFileSelect = (key: string, file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, or PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5MB.");
      return;
    }

    const updated = { ...uploadingDocs, [key]: file };
    setUploadingDocs(updated);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => ({ ...prev, [key]: e.target?.result as string }));
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => ({ ...prev, [key]: "pdf" }));
    }
  };

  const removeSelectedFile = (key: string) => {
    const updated = { ...uploadingDocs };
    delete updated[key];
    setUploadingDocs(updated);
    setPreviews((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleUploadToApp = async () => {
    if (!selectedApp || Object.keys(uploadingDocs).length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Object.entries(uploadingDocs).forEach(([key, file]) => {
        formData.append(key, file);
      });

      const res = await applicationApi.uploadDocuments(selectedApp.id, formData);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApp.id ? { ...app, documents: res.documents } : app
        )
      );

      toast.success("Documents uploaded successfully!");
      setUploadDialogOpen(false);
      setUploadingDocs({});
      setPreviews({});
      setSelectedApp(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload documents.");
    } finally {
      setIsUploading(false);
    }
  };

  const openUploadDialog = (app: Application) => {
    setSelectedApp(app);
    setUploadingDocs({});
    setPreviews({});
    setUploadDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage your application documents</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No applications found.</p>
            <p className="text-sm text-muted-foreground mt-2">Submit an application to start uploading documents.</p>
          </CardContent>
        </Card>
      ) : (
        applications.map((app) => {
          const uploadedDocs = getAppDocuments(app);
          const missingDocs = getMissingDocs(app);
          const hasAllDocs = missingDocs.length === 0;

          return (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{app.applicationId}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {app.district} • Submitted {formatDate(app.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAllDocs ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={16} /> All Documents Uploaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-sm">
                        <XCircle size={16} /> {missingDocs.length} Missing
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Missing Documents Alert */}
                {!hasAllDocs && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-2">Missing Documents:</p>
                    <div className="flex flex-wrap gap-2">
                      {missingDocs.map((doc) => (
                        <span key={doc.key} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">
                          {doc.label}
                        </span>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => openUploadDialog(app)}
                    >
                      <Upload size={14} className="mr-1" /> Upload Missing Docs
                    </Button>
                  </div>
                )}

                {/* Uploaded Documents Grid */}
                {Object.keys(uploadedDocs).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {app.documents.map((doc) => {
                      const isImage = doc.format?.startsWith("image/");
                      return (
                        <div key={doc.id || doc.publicId} className="border rounded-lg p-3 bg-card">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded">
                              {isImage ? <Image size={16} className="text-primary" /> : <File size={16} className="text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.label}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {doc.uploadedAt ? formatDate(doc.uploadedAt) : "N/A"}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setViewDocument(doc)}
                          >
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No documents uploaded yet for this application.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => !open && setUploadDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <h3 className="font-semibold">Upload Documents</h3>
            {selectedApp && (
              <p className="text-sm text-muted-foreground">
                Uploading to: <span className="font-mono">{selectedApp.applicationId}</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(DOC_KEY_TO_LABEL).map(([key, label]) => {
                const preview = previews[key];
                const file = uploadingDocs[key];

                return (
                  <div key={key} className="relative">
                    {file && (
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(key)}
                        className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/80"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                    <label
                      className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer min-h-[120px] transition-colors ${
                        file
                          ? "border-green-400 bg-green-50/50"
                          : "border-border bg-muted/20 hover:bg-muted/50"
                      }`}
                    >
                      {file ? (
                        preview === "pdf" ? (
                          <>
                            <File size={24} className="text-green-600 mb-2" />
                            <p className="text-xs text-green-700 text-center font-medium">{label}</p>
                            <p className="text-xs text-green-600 mt-1">{file.name}</p>
                          </>
                        ) : preview ? (
                          <>
                            <img src={preview} alt={label} className="w-16 h-16 object-cover rounded mb-2" />
                            <p className="text-xs text-green-700 text-center font-medium">{label}</p>
                          </>
                        ) : (
                          <>
                            <Clock3 size={24} className="text-amber-600 mb-2" />
                            <p className="text-xs text-center">{label}</p>
                          </>
                        )
                      ) : (
                        <>
                          <Upload size={24} className="text-primary mb-2" />
                          <p className="text-xs text-center font-medium">{label}</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelect(key, f);
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUploadToApp}
                disabled={Object.keys(uploadingDocs).length === 0 || isUploading}
              >
                {isUploading ? "Uploading..." : `Upload ${Object.keys(uploadingDocs).length} Document(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewDocument} onOpenChange={(open) => !open && setViewDocument(null)}>
        <DialogContent className="max-w-2xl">
          {viewDocument && (
            <div className="space-y-4">
              <h3 className="font-semibold">{viewDocument.label}</h3>
              <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center min-h-[300px]">
                {viewDocument.format?.startsWith("image/") ? (
                  <img
                    src={viewDocument.url}
                    alt={viewDocument.label}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <File size={48} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">PDF Document</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(viewDocument.url, "_blank")}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}