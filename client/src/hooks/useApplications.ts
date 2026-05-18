import { useState, useEffect, useCallback } from "react";
import type { Application, ApplicationFormData } from "@/types";
import { applicationApi } from "@/lib/api";
import { toast } from "sonner";

export function useApplications(userId?: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await applicationApi.list();
      setApplications(res.applications);
    } catch (err: any) {
      toast.error(err.message || "Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const createApplication = useCallback(
    async (data: ApplicationFormData, _userId: string, files?: Record<string, File>): Promise<Application> => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, String(val));
      });
      if (files) {
        Object.entries(files).forEach(([key, file]) => formData.append(key, file));
      }
      const res = await applicationApi.create(formData);
      setApplications((prev) => [res.application, ...prev]);
      return res.application;
    },
    []
  );

  const updateStatus = useCallback(
    async (id: string, status: Application["status"], remarks?: string) => {
      const res = await applicationApi.updateStatus(id, { status, remarks });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? res.application : a))
      );
    },
    []
  );

  const filteredApps = userId
    ? applications.filter((a) => a.userId === userId)
    : applications;

  return { applications: filteredApps, isLoading, createApplication, updateStatus, refetch: fetchApplications };
}
