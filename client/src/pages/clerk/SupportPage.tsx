import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Users, MessageSquare } from "lucide-react";
import type { SupportClerk } from "@/types";

const FAQ_DATA = [
  { q: "How do I verify an application?", a: "Review all documents, check CNIC authenticity, verify address proof. Then update status from Pending → In Review → Verified." },
  { q: "What if a document is suspicious?", a: "Mark the application as Rejected and provide clear remarks explaining the issue. The citizen can resubmit with correct documents." },
  { q: "Can I approve applications directly?", a: "No. As a clerk, you can only verify and forward to admin. Final approval is done by the administrator only." },
  { q: "How do I contact admin for escalation?", a: "Use the support contacts below or mark urgent flags in application remarks for admin attention." },
  { q: "What districts am I responsible for?", a: "You are assigned to verify applications only from your designated district as shown in your profile settings." },
];

export default function ClerkSupportPage() {
  const [clerks, setClerks] = useState<SupportClerk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const fetchClerks = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getSupportClerks();
      setClerks(res.clerks);
    } catch (err: any) {
      toast.error(err.message || "Failed to load support information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClerks();
  }, []);

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Support</h1>
        <p className="text-muted-foreground mt-1">Contact administrators and view FAQs.</p>
      </div>

      {/* Admin Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} /> Admin Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : clerks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No admin contacts available. Please escalate through official channels.
            </p>
          ) : (
            <div className="space-y-4">
              {clerks.map((clerk) => (
                <div key={clerk.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{clerk.name}</p>
                      <p className="text-sm text-muted-foreground">{clerk.district} District</p>
                      <p className="text-sm text-muted-foreground">{clerk.email}</p>
                      {clerk.phone && <p className="text-sm text-muted-foreground">{clerk.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendEmail(clerk.email)}
                      >
                        <Mail size={14} className="mr-1" /> Email
                      </Button>
                      {clerk.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCall(clerk.phone)}
                        >
                          <Phone size={14} className="mr-1" /> Call
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={18} /> Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {FAQ_DATA.map((faq, idx) => (
              <div key={idx} className="border rounded-lg">
                <button
                  className="w-full text-left p-4 flex items-center justify-between"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <span className="text-muted-foreground">{expandedFaq === idx ? "−" : "+"}</span>
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}