import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Users, MessageSquare } from "lucide-react";
import type { SupportClerk } from "@/types";

const FAQ_DATA = [
  { q: "How long does it take to process a domicile certificate?", a: "Typically 15-30 working days after submission of all required documents." },
  { q: "What documents do I need?", a: "CNIC, proof of address, passport-size photograph, and birth certificate are required." },
  { q: "How can I track my application?", a: "Use your Application ID or Certificate Number on the Track Application page." },
  { q: "What if my application is rejected?", a: "You will receive a reason for rejection. You can resubmit after fixing the issues." },
  { q: "Can I apply on behalf of someone else?", a: "Yes, but you need an authorization letter signed by the applicant." },
];

export default function CitizenSupportPage() {
  const [clerks, setClerks] = useState<SupportClerk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const fetchClerks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getSupportClerks();
      setClerks(res.clerks);
    } catch (err: any) {
      toast.error(err.message || "Failed to load support information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClerks();
  }, [fetchClerks]);

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support & Help</h1>
        <p className="text-sm text-muted-foreground mt-1">Get help from district-wise support clerks</p>
      </div>

      {/* Support Clerks by District */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} /> District Support Clerks
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
              No support clerks available. Please contact the main office.
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