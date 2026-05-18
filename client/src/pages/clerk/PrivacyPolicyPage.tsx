import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw } from "lucide-react";

const DEFAULT_POLICY = `
<h2>Clerk Privacy & Usage Policy for DMS AJ&K</h2>

<h3>1. Purpose</h3>
<p>This policy outlines the guidelines for government clerks using the Domicile Management System (DMS) to process citizen applications.</p>

<h3>2. Data Access</h3>
<p>Clerks have access to:</p>
<ul>
<li>Applications assigned to their district only</li>
<li>Citizen documents submitted with applications</li>
<li>Application status and remarks fields</li>
<li>Admin contact information for escalation</li>
</ul>

<h3>3. Confidentiality</h3>
<p>All citizen data accessed through DMS must be kept strictly confidential. Unauthorized disclosure is a violation of official duty and may result in disciplinary action.</p>

<h3>4. Verification Standards</h3>
<p>Clerks must:</p>
<ul>
<li>Verify all documents against original records where possible</li>
<li>Update application status accurately at each stage</li>
<li>Provide clear remarks when rejecting or forwarding applications</li>
<li>Process applications within prescribed timelines</li>
</ul>

<h3>5. Audit Trail</h3>
<p>All actions taken on applications are logged and can be reviewed for accountability.</p>

<h3>6. Contact</h3>
<p>For policy questions, contact the System Administrator.</p>
`.trim();

export default function ClerkPrivacyPolicyPage() {
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
            <p className="text-sm text-muted-foreground">Read-only view of system policies</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPolicy}>
          <RefreshCw size={14} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Policy Content */}
      <Card>
        <CardHeader>
          <CardTitle>Clerk Usage Policy</CardTitle>
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
    </div>
  );
}