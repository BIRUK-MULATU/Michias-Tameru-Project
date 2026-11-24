import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { AuditLogResponse, PageResponse } from "@/types/auditLog";
import type {
  EmployeeComparisonRow,
  EmployeePerformanceResponse,
  EmployeeSummaryResponse,
} from "@/types/employee";
import type { ClosingPreviewResponse } from "@/types/closing";
import type { StockMovementResponse } from "@/types/inventory";
import type { SaleResponse } from "@/types/sale";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<EmployeeSummaryResponse[]>>("/api/admin/employees");
      return response.data.data;
    },
  });
}

export function useEmployeeComparison() {
  return useQuery({
    queryKey: ["employees", "comparison"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<EmployeeComparisonRow[]>>(
        "/api/admin/employees/performance-comparison",
      );
      return response.data.data;
    },
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<EmployeeSummaryResponse>>(`/api/admin/employees/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useEmployeeInventory(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", id, "inventory"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ClosingPreviewResponse>>(
        `/api/admin/employees/${id}/inventory`,
      );
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useEmployeeSales(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", id, "sales"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SaleResponse[]>>(`/api/admin/employees/${id}/sales`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useEmployeePerformance(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", id, "performance"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<EmployeePerformanceResponse>>(
        `/api/admin/employees/${id}/performance`,
      );
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useEmployeeStockMovements(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", id, "stock-movements"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PageResponse<StockMovementResponse>>>(
        `/api/admin/employees/${id}/stock-movements`,
      );
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useEmployeeActivities(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", id, "activities"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PageResponse<AuditLogResponse>>>(
        `/api/admin/employees/${id}/activities`,
      );
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}
