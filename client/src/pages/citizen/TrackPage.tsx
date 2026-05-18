import { useState } from "react";
import { applicationApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle, Clock3, XCircle, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Application } from "@/types";

const STAGES = [
  { id: "submitted", label: "Submitted", icon: FileTextIcon },
  { id: "pending", label: "Under Review", icon: Clock3 },
  { id: "in_review", label: "In Review", icon: AlertCircle },
  { id: "approved", label: "Approved", icon: CheckCircle },
  { id: "rejected", label: "Rejected", icon: XCircle },
];

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export default function CitizenTrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      toast.error("Please enter an Application ID or Certificate Number.");
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setApplication(null);

    try {
      const res = await applicationApi.list();
      const found = res.applications.find(
        (app) =>
          app.applicationId.toLowerCase() === trackingId.toLowerCase() ||
          app.certificateNumber?.toLowerCase() === trackingId.toLowerCase()
      );

      if (found) {
        setApplication(found);
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search application.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStageIndex = (status: string) => {
    switch (status) {
      case "pending": return 1;
      case "in_review": return 2;
      case "verified": return 2;
      case "approved": return 3;
      case "rejected": return 4;
      default: return 0;
    }
  };

  const currentStage = application ? getStageIndex(application.status) : -1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Track Application</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your Application ID or Certificate Number</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="tracking">Application ID or Certificate Number</Label>
              <Input
                id="tracking"
                placeholder="DMS-2024-0001"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="mt-2"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search size={16} className="mr-2" /> Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {notFound && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No application found with this ID.</p>
            <p className="text-sm text-muted-foreground mt-2">Please check your Application ID or Certificate Number and try again.</p>
          </CardContent>
        </Card>
      )}

      {application && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Application Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{application.applicationId}</p>
                  <p className="text-sm text-muted-foreground">{application.district}</p>
                </div>
                <StatusBadge status={application.status as any} />
              </div>

              {/* Stage Progress */}
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-1 bg-muted" />
                <div
                  className="absolute top-4 left-0 h-1 bg-primary transition-all"
                  style={{ width: `${(currentStage / (STAGES.length - 1)) * 100}%` }}
                />
                {STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isCompleted = idx <= currentStage;
                  const isCurrent = idx === currentStage;
                  return (
                    <div key={stage.id} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-xs mt-2 text-center ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                        {stage.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Applicant Name</p>
                  <p className="font-medium">{application.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CNIC</p>
                  <p className="font-medium">{application.cnic}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Father Name</p>
                  <p className="font-medium">{application.fatherName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">District</p>
                  <p className="font-medium">{application.district}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{application.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submission Date</p>
                  <p className="font-medium">{formatDate(application.submittedAt)}</p>
                </div>
              </div>

              {application.remarks && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Remarks / Reason</p>
                  <p className="text-sm mt-1">{application.remarks}</p>
                </div>
              )}

              {application.certificateNumber && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-600">Certificate Number</p>
                  <p className="font-mono font-medium text-green-700">{application.certificateNumber}</p>
                  {application.issuedAt && (
                    <p className="text-xs text-green-600 mt-1">Issued: {formatDate(application.issuedAt)}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}