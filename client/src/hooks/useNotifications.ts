import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "@/types";
import { notificationApi } from "@/lib/api";
import { toast } from "sonner";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userIdRef = useRef<string | undefined>(undefined);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await notificationApi.list();
      setNotifications(res.notifications);
    } catch (err: any) {
      // Don't show toast for auth errors (user logged out)
      if (!err.message?.includes("401") && !err.message?.includes("Not authorized")) {
        toast.error(err.message || "Failed to load notifications.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Skip if userId hasn't actually changed
    if (userId === userIdRef.current) return;
    userIdRef.current = userId;
    fetchNotifications();
  }, [fetchNotifications, userId]);

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, isLoading, markRead, markAllRead, unreadCount };
}
