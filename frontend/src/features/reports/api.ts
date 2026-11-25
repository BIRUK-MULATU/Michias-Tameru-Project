import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { SalesReportResponse } from "@/types/report";

export function useSalesSummary(params?: {
  locationId?: string;
  from?: string;
  to?: string;
  refetchIntervalMs?: number;
}) {
  return useQuery({
    queryKey: ["sales-summary", params?.locationId ?? "all", params?.from ?? "", params?.to ?? ""],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SalesReportResponse>>("/api/reports/sales", {
        params: { locationId: params?.locationId, from: params?.from, to: params?.to },
      });
      return response.data.data;
    },
    refetchInterval: params?.refetchIntervalMs,
  });
}

async function downloadBlob(path: string, params: Record<string, string | undefined>, filename: string) {
  const response = await apiClient.get(path, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadSalesExport(locationId: string | undefined, format: "csv" | "xlsx") {
  return downloadBlob("/api/reports/sales/export", { locationId, format }, `sales-report.${format}`);
}

export function downloadInventoryExport(locationId: string, format: "csv" | "xlsx") {
  return downloadBlob("/api/reports/inventory/export", { locationId, format }, `inventory-report.${format}`);
}
