import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useVerification } from "@/hooks/useVerification";
import { APP_NAME } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldAlert, Search, QrCode, Camera, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

const verifySchema = z.object({
  certificateNumber: z.string().min(5, "Please enter a valid certificate number"),
});

type VerifyForm = z.infer<typeof verifySchema>;

export default function Verify() {
  const { result, isLoading, notFound, verify } = useVerification();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const form = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: { certificateNumber: "" },
  });

  const onSubmit = (data: VerifyForm) => verify(data.certificateNumber);

  const startScanner = async () => {
    setCameraOpen(true);
    setScanning(true);
  };

  useEffect(() => {
    if (cameraOpen && scannerRef.current === null) {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Extract certificate number from QR code or use directly
          let certNumber = decodedText.trim();

          // If it's a URL, extract the certificate number
          if (certNumber.includes("/verify/")) {
            const parts = certNumber.split("/verify/");
            certNumber = parts[parts.length - 1];
          }

          form.setValue("certificateNumber", certNumber);
          stopScanner();
          setCameraOpen(false);
          verify(certNumber);
        },
        () => {}
      ).catch((err) => {
        console.error("Camera error:", err);
        setScanning(false);
      });
    }

    return () => {
      stopScanner();
    };
  }, [cameraOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const closeCamera = () => {
    stopScanner();
    setCameraOpen(false);
  };

  const handleCertFromQr = () => {
    startScanner();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-20 bg-primary text-primary-foreground flex items-center px-8 shadow-md">
        <Link href="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight">
          <ShieldAlert className="w-8 h-8 text-secondary" />
          <span>{APP_NAME}</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/30">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Verify Certificate</h1>
            <p className="text-muted-foreground text-lg">
              Authenticate any official Domicile Certificate issued by the Government of AJ&K.
            </p>
          </div>

          <Card className="border-border shadow-md">
            <CardContent className="p-8 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="certificateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="e.g. AJ-2024-0001"
                            className="text-lg py-6"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-4">
                    <Button type="submit" size="lg" className="flex-1 text-lg font-semibold" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5 mr-2" />
                      )}
                      Verify Now
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="px-6 border-2"
                      onClick={handleCertFromQr}
                      title="Scan QR Code"
                    >
                      <Camera className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Valid result */}
              {result?.valid && (
                <div className="pt-6 border-t border-border animate-in fade-in slide-in-from-bottom-4 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                    <span className="text-xl font-bold">Certificate Authenticated</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: "Certificate No.", value: result.certificateNumber },
                      { label: "Applicant Name", value: result.fullNameMasked },
                      { label: "District", value: result.district },
                      { label: "Issue Date", value: result.issueDate },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-1">
                        <p className="text-muted-foreground">{label}</p>
                        <p className="font-semibold">{value ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center pt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {result.status ?? "Active"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Not found */}
              {notFound && (
                <div className="pt-6 border-t border-border animate-in fade-in flex flex-col items-center justify-center gap-3 text-destructive py-4">
                  <XCircle className="w-12 h-12" />
                  <span className="text-xl font-bold">Invalid Certificate</span>
                  <p className="text-muted-foreground text-center text-sm">
                    No record found for this certificate number. Please check the number and try again.
                    <br />
                    <span className="text-xs">Try: <code className="font-mono">AJ-2024-0001</code></span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground max-w-md mx-auto">
            Privacy Disclaimer: This portal only displays partial information to confirm authenticity while protecting citizen privacy.
          </p>
        </div>
      </main>

      {/* Camera Scanner Dialog */}
      <Dialog open={cameraOpen} onOpenChange={closeCamera}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Scan QR Code
              </span>
              <Button variant="ghost" size="icon" onClick={closeCamera}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div
              id="qr-reader"
              ref={videoRef}
              className="w-full max-w-sm rounded-lg overflow-hidden"
            />
            {scanning && (
              <p className="text-sm text-muted-foreground text-center">
                Position the QR code within the frame. Scanning will happen automatically.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}