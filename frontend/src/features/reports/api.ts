import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { SalesReportResponse } from "@/types/report";

export function useSalesSummary(params?: { locationId?: string }) {
  return useQuery({
    queryKey: ["sales-summary", params?.locationId ?? "all"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SalesReportResponse>>("/api/reports/sales", { params });
      return response.data.data;
    },
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
