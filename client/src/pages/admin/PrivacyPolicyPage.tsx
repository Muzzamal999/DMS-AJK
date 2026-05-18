import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Save, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_POLICIES = `
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

export default function AdminPrivacyPolicyPage() {
  const [html, setHtml] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const fetchPolicy = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPrivacyPolicy();
      const policyHtml = res.html || DEFAULT_POLICIES;
      setHtml(policyHtml);
      setOriginalHtml(policyHtml);
    } catch (err: any) {
      setHtml(DEFAULT_POLICIES);
      setOriginalHtml(DEFAULT_POLICIES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminApi.updatePrivacyPolicy(html);
      setOriginalHtml(html);
      toast.success("Privacy policy updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save privacy policy.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = html !== originalHtml;

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Manage the official privacy policy for citizens</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye size={14} className="mr-2" /> {isPreview ? "Edit" : "Preview"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
              <Save size={14} className="mr-2" /> {isSaving ? "Saving..." : "Save Policy"}
            </Button>
          </div>
        </div>

        {/* Editor / Preview */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isPreview ? "Policy Preview" : "Rich Text Editor"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 bg-muted animate-pulse rounded-lg" />
            ) : isPreview ? (
              <div
                className="prose prose-sm max-w-none p-6 border rounded-lg min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <>
                <Textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="min-h-[400px] font-mono text-sm resize-none"
                  placeholder="Enter HTML content..."
                />
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> You can use HTML tags for formatting. Supported tags include
                    &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a href&gt;,
                    &lt;table&gt;, and more.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Default Policies Reference */}
        {!html && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Default Policy Template</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{DEFAULT_POLICIES}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminSidebar>
  );
}