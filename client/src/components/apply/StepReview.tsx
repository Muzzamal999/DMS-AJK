import { CheckCircle2 } from "lucide-react";

interface ReviewData {
  fullName: string;
  fatherName: string;
  cnic: string;
  dateOfBirth: string;
  gender: string;
  district: string;
  currentAddress: string;
  permanentAddress: string;
}

interface StepReviewProps {
  data: ReviewData;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
      <p className="font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

export function StepReview({ data }: StepReviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-xl font-bold border-b pb-2">Review Your Application</h2>
      <p className="text-sm text-muted-foreground">
        Please confirm all details before submitting. Incorrect information may delay processing.
      </p>

      <div className="bg-muted/30 rounded-lg p-6 space-y-6 text-sm">
        <div>
          <h3 className="font-semibold text-base mb-4 border-b pb-2">Personal Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <ReviewRow label="Full Name" value={data.fullName} />
            <ReviewRow label="Father / Husband Name" value={data.fatherName} />
            <ReviewRow label="CNIC Number" value={data.cnic} />
            <ReviewRow label="Date of Birth" value={data.dateOfBirth} />
            <ReviewRow label="Gender" value={data.gender} />
            <ReviewRow label="District of Origin" value={data.district} />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-4 border-b pb-2">Address Information</h3>
          <div className="space-y-3">
            <ReviewRow label="Current Address" value={data.currentAddress} />
            <ReviewRow label="Permanent Address" value={data.permanentAddress} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 p-3 rounded">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-medium">All required documents have been attached and are pending review.</span>
        </div>
      </div>
    </div>
  );
}
