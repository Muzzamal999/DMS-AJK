import { useEffect, useState, useCallback } from "react";
import { notificationApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, ChevronRight, Mail, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { Notification } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ClerkNotificationsPage() {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationApi.list();
      setNotifications(res.notifications);
    } catch (err: any) {
      toast.error(err.message || "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark all as read.");
    }
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as read.");
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Separate incoming and admin response notifications
  const incomingNotifications = notifications.filter((n) =>
    n.title?.toLowerCase().includes("assigned") || n.title?.toLowerCase().includes("new")
  );
  const adminResponseNotifications = notifications.filter((n) =>
    n.title?.toLowerCase().includes("approved") ||
    n.title?.toLowerCase().includes("rejected") ||
    n.title?.toLowerCase().includes("processed")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} className="mr-2" /> Mark All as Read
          </Button>
        )}
      </div>

      {/* Incoming Notifications */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Mail size={18} /> Incoming (New Assignments)
        </h3>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))
          ) : incomingNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No new assignments received.
              </CardContent>
            </Card>
          ) : (
            incomingNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all cursor-pointer hover:shadow-md ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => {
                  if (!notification.read) handleMarkRead(notification.id);
                  setLocation("/clerk/applications");
                }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notification.read ? "bg-primary/10" : "bg-muted"}`}>
                      <Bell size={18} className={!notification.read ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Admin Response Notifications */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertCircle size={18} /> Admin Response
        </h3>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))
          ) : adminResponseNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No admin responses yet.
              </CardContent>
            </Card>
          ) : (
            adminResponseNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all cursor-pointer hover:shadow-md ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => {
                  if (!notification.read) handleMarkRead(notification.id);
                  setLocation("/clerk/status-tracker");
                }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notification.read ? "bg-primary/10" : "bg-muted"}`}>
                      <AlertCircle size={18} className={!notification.read ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}