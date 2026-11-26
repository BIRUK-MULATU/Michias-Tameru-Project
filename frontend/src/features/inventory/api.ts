import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { InventoryBalanceResponse, StockAdjustmentResponse } from "@/types/inventory";

export function useInventoryBalances(locationId?: string, search?: string) {
  return useQuery({
    queryKey: ["inventory-balances", locationId, search ?? ""],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<InventoryBalanceResponse[]>>("/api/inventory", {
        params: { locationId, search },
      });
      return response.data.data;
    },
    enabled: Boolean(locationId),
  });
}

export function useInventoryBalancesForLocations(locationIds: string[]) {
  const results = useQueries({
    queries: locationIds.map((locationId) => ({
      queryKey: ["inventory-balances", locationId, ""],
      queryFn: async () => {
        const response = await apiClient.get<ApiResponse<InventoryBalanceResponse[]>>("/api/inventory", {
          params: { locationId },
        });
        return response.data.data;
      },
    })),
  });

  return {
    data: results.flatMap((result) => result.data ?? []),
    isLoading: results.some((result) => result.isLoading),
  };
}

export function useStockAdjustments(locationId?: string) {
  return useQuery({
    queryKey: ["stock-adjustments", locationId ?? "all"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<StockAdjustmentResponse[]>>(
        "/api/inventory/adjustments",
        { params: { locationId } },
      );
      return response.data.data;
    },
  });
}

export interface RequestAdjustmentInput {
  locationId: string;
  productVariantId: string;
  quantityDelta: number;
  reason: string;
}

export function useRequestAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequestAdjustmentInput) => {
      const response = await apiClient.post<ApiResponse<StockAdjustmentResponse>>(
        "/api/inventory/adjustments",
        input,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] }),
  });
}

function useAdjustmentDecision(action: "approve" | "reject") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<StockAdjustmentResponse>>(
        `/api/inventory/adjustments/${id}/${action}`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
    },
  });
}

export function useApproveAdjustment() {
  return useAdjustmentDecision("approve");
}

export function useRejectAdjustment() {
  return useAdjustmentDecision("reject");
}
