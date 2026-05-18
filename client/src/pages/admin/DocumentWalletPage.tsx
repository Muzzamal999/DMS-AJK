import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, FileText, User, MapPin, Eye, Download, ZoomIn, Search } from "lucide-react";
import type { DocumentWallet, Document } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminDocumentWalletPage() {
  const [wallets, setWallets] = useState<Record<string, DocumentWallet>>({});
  const [selectedCitizenId, setSelectedCitizenId] = useState<string>("");
  const [citizens, setCitizens] = useState<{ id: string; name: string; cnic: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const fetchCitizens = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers();
      const citizensList = res.users
        .filter((u) => u.role === "citizen")
        .map((u) => ({ id: u.id, name: u.name, cnic: u.cnic || "" }));
      setCitizens(citizensList);

      if (citizensList.length > 0 && !selectedCitizenId) {
        setSelectedCitizenId(citizensList[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load citizens.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCitizenId]);

  const fetchWallet = useCallback(async (citizenId: string) => {
    try {
      const res = await adminApi.getDocumentWallet(citizenId);
      setWallets((prev) => ({ ...prev, [citizenId]: res }));
    } catch (err: any) {
      toast.error(err.message || "Failed to load document wallet.");
    }
  }, []);

  useEffect(() => {
    fetchCitizens();
  }, []);

  useEffect(() => {
    if (selectedCitizenId) {
      fetchWallet(selectedCitizenId);
    }
  }, [selectedCitizenId, fetchWallet]);

  const wallet = wallets[selectedCitizenId];
  const filteredCitizens = citizens.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cnic.includes(searchQuery)
  );

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage citizen documents organized by individual folders
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Citizens List - Left Panel */}
          <Card className="xl:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen size={18} /> Citizens
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Search by name or CNIC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredCitizens.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isLoading ? "Loading..." : "No citizens found"}
                </p>
              ) : (
                filteredCitizens.map((citizen) => (
                  <button
                    key={citizen.id}
                    onClick={() => setSelectedCitizenId(citizen.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCitizenId === citizen.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <p className="font-medium text-sm">{citizen.name}</p>
                    <p className="text-xs text-muted-foreground">{citizen.cnic || "No CNIC"}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Wallet Details - Right Panel */}
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={18} /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!wallet ? (
                <div className="text-center py-12 text-muted-foreground">
                  Select a citizen to view their documents
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Citizen Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <User size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Citizen Name</p>
                        <p className="font-medium">{wallet.citizen.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border">
                      <MapPin size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tracking District</p>
                        <p className="font-medium">{wallet.citizen.district || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Document Status */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Document Status</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {wallet.documentStatus.map((doc) => (
                        <div
                          key={doc.label}
                          className={`p-3 rounded-lg border text-center ${
                            doc.present ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <p className="text-xs font-medium">{doc.label}</p>
                          <p className={`text-lg font-bold mt-1 ${doc.present ? "text-green-600" : "text-red-600"}`}>
                            {doc.present ? "Uploaded" : "Missing"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Uploaded Documents</h4>
                    {wallet.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                        No documents uploaded yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wallet.documents.map((doc) => (
                          <div key={doc.id || doc.publicId} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-sm">{doc.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded: {doc.uploadedAt ? formatDate(doc.uploadedAt) : "Unknown"}
                                </p>
                              </div>
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {doc.format?.split("/")[1]?.toUpperCase() || "FILE"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(doc.url, "_blank")}
                              >
                                <Eye size={14} className="mr-1" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = doc.url;
                                  a.download = doc.label;
                                  a.click();
                                }}
                              >
                                <Download size={14} className="mr-1" /> Download
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedDoc(doc)}
                              >
                                <ZoomIn size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zoom Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedDoc(null)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedDoc.url}
              alt={selectedDoc.label}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => window.open(selectedDoc.url, "_blank")}>
                <ExternalLink size={14} className="mr-2" /> Open
              </Button>
              <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminSidebar>
  );
}

function ExternalLink({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}