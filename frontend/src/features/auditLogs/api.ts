import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { AuditLogResponse, PageResponse } from "@/types/auditLog";

export interface AuditLogFilters {
  username?: string;
  module?: string;
  actionType?: string;
  success?: boolean;
  page?: number;
  size?: number;
}

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ["activity-logs", filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PageResponse<AuditLogResponse>>>(
        "/api/admin/activity-logs",
        { params: filters },
      );
      return response.data.data;
    },
  });
}

export async function downloadActivityLogExport(
  filters: Omit<AuditLogFilters, "page" | "size">,
  format: "csv" | "xlsx",
): Promise<void> {
  const response = await apiClient.get("/api/admin/activity-logs/export", {
    params: { ...filters, format },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `activity-log.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
