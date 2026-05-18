import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REQUIRED_DOCS = [
  { key: "cnic_front",     label: "CNIC Copy (Front)",         hint: "Front side of your CNIC" },
  { key: "cnic_back",      label: "CNIC Copy (Back)",          hint: "Back side of your CNIC" },
  { key: "photograph",     label: "Passport Size Photograph",   hint: "Max 2MB — JPEG/PNG only" },
  { key: "residence_proof",label: "Proof of Residence",        hint: "Electricity bill or rental agreement" },
];

interface Props {
  onFilesChange?: (files: Record<string, File>) => void;
}

export function StepDocuments({ onFilesChange }: Props) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = (key: string, file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, or PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5MB.");
      return;
    }

    const updated = { ...files, [key]: file };
    setFiles(updated);
    onFilesChange?.(updated);

    // Preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) =>
        setPreviews((prev) => ({ ...prev, [key]: e.target?.result as string }));
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => ({ ...prev, [key]: "pdf" }));
    }
  };

  const removeFile = (key: string) => {
    const updated = { ...files };
    delete updated[key];
    setFiles(updated);
    onFilesChange?.(updated);
    setPreviews((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (refs.current[key]) refs.current[key]!.value = "";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-xl font-bold border-b pb-2">Document Uploads</h2>
      <p className="text-sm text-muted-foreground">
        Please upload clear, legible copies of the following documents. All files must be in PDF, JPEG, or PNG format (max 5MB each). Documents are securely stored via Cloudinary.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_DOCS.map((doc) => {
          const uploaded = !!files[doc.key];
          const preview = previews[doc.key];

          return (
            <div key={doc.key} className="relative">
              {uploaded && (
                <button
                  type="button"
                  onClick={() => removeFile(doc.key)}
                  className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/80"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <label
                className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[140px] ${
                  uploaded
                    ? "border-green-400 bg-green-50/50"
                    : "border-border bg-muted/20 hover:bg-muted/50"
                }`}
              >
                {uploaded ? (
                  preview === "pdf" ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                      <p className="font-medium text-sm text-green-700 text-center">{doc.label}</p>
                      <p className="text-xs text-green-600 mt-1">{files[doc.key].name}</p>
                    </>
                  ) : (
                    <>
                      <img
                        src={preview}
                        alt={doc.label}
                        className="w-20 h-20 object-cover rounded mb-2 border"
                      />
                      <p className="font-medium text-xs text-green-700 text-center">{doc.label}</p>
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                    </>
                  )
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-primary mb-3" />
                    <p className="font-medium text-sm text-center">{doc.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 text-center">{doc.hint}</p>
                  </>
                )}
                <input
                  ref={(el) => { refs.current[doc.key] = el; }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(doc.key, f);
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {Object.keys(files).length} of {REQUIRED_DOCS.length} documents uploaded.
        {Object.keys(files).length === REQUIRED_DOCS.length && (
          <span className="ml-2 text-green-600 font-medium">✓ All documents ready</span>
        )}
      </p>
    </div>
  );
}
