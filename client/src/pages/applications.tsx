import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Applications() {
  const { user } = useAuth();
  const { applications, isLoading } = useApplications(user?.id);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Applications</h1>
            <p className="text-muted-foreground mt-1">View and track the status of your domicile applications.</p>
          </div>
          <Link href="/apply">
            <Button className="bg-primary hover:bg-primary/90">New Application</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 h-20 animate-pulse bg-muted/40 rounded" />
              </Card>
            ))
          ) : applications.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-xl">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-1">No Applications Found</h3>
              <p className="text-muted-foreground mb-4">You haven&apos;t submitted any domicile applications yet.</p>
              <Link href="/apply">
                <Button variant="outline">Start an Application</Button>
              </Link>
            </div>
          ) : (
            applications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow border-border">
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary mt-1 hidden sm:block">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg">{app.fullName}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-sm text-muted-foreground font-mono mb-2">Ref: {app.applicationId}</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                        <span><strong className="text-foreground">CNIC:</strong> {app.cnic}</span>
                        <span><strong className="text-foreground">District:</strong> {app.district}</span>
                        <span><strong className="text-foreground">Submitted:</strong> {formatDate(app.submittedAt)}</span>
                        {app.certificateNumber && (
                          <span><strong className="text-foreground">Cert No:</strong> {app.certificateNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto flex justify-end">
                    <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 w-full md:w-auto">
                      View Details <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
