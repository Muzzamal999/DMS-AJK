import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw } from "lucide-react";

const DEFAULT_POLICY = `
<h2>Privacy Policy for DMS AJ&K</h2>

<h3>1. Collection of Information</h3>
<p>We collect personal information including name, CNIC, date of birth, photographs, and address details for the sole purpose of processing domicile certificate applications under the laws of Azad Jammu & Kashmir.</p>

<h3>2. Data Usage</h3>
<p>Your personal data is used exclusively for:</p>
<ul>
<li>Processing domicile certificate applications</li>
<li>Issuing official government certificates</li>
<li>Maintaining audit logs for compliance</li>
<li>Communicating application status updates</li>
</ul>

<h3>3. Data Protection</h3>
<p>All personal data is encrypted and stored securely in compliance with government data protection standards. Access is restricted to authorized personnel only.</p>

<h3>4. Data Retention</h3>
<p>Application records are retained for the period required by law. Certificate records are maintained permanently for verification purposes.</p>

<h3>5. Third-Party Disclosure</h3>
<p>We do not sell, trade, or transfer your personally identifiable information to outside parties except as required by law.</p>

<h3>6. Contact Information</h3>
<p>For privacy concerns, contact the Data Protection Officer at dpi@ajk.gov.pk</p>
`.trim();

export default function CitizenPrivacyPolicyPage() {
  const [html, setHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPolicy = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPrivacyPolicy();
      setHtml(res.html || DEFAULT_POLICY);
    } catch (err: any) {
      setHtml(DEFAULT_POLICY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Read our privacy and data protection policies</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPolicy}>
          <RefreshCw size={14} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Policy Content */}
      <Card>
        <CardHeader>
          <CardTitle>Official Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            For any privacy concerns or data access requests, please contact:<br />
            <strong>Data Protection Officer</strong><br />
            Email: dpi@ajk.gov.pk<br />
            Phone: +92-5822-123456
          </p>
        </CardContent>
      </Card>
    </div>
  );
}