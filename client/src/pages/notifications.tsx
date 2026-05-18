import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Check } from "lucide-react";

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, isLoading, markRead, markAllRead } = useNotifications(user?.id);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">Updates and alerts regarding your applications.</p>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 h-20 animate-pulse bg-muted/40 rounded" />
              </Card>
            ))
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">You&apos;re all caught up. No new notifications.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`transition-colors ${notif.read ? "bg-background opacity-75" : "bg-primary/5 border-primary/20"}`}
              >
                <CardContent className="p-5 flex gap-4 items-start">
                  <div className={`p-2 rounded-full mt-1 shrink-0 ${notif.read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                    {notif.read ? <Bell className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <h4 className={`font-semibold text-base ${notif.read ? "text-foreground" : "text-primary"}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                  </div>
                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary shrink-0"
                      onClick={() => markRead(notif.id)}
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
