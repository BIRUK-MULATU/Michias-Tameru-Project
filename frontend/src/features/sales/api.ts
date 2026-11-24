import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { PaymentMethod, SaleResponse } from "@/types/sale";

export function useSales(params?: { locationId?: string }) {
  return useQuery({
    queryKey: ["sales", params?.locationId ?? "all"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SaleResponse[]>>("/api/sales", { params });
      return response.data.data;
    },
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sales", "detail", id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SaleResponse>>(`/api/sales/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export interface CreateSaleItemInput {
  productVariantId: string;
  quantity: number;
  discountAmount?: number;
}

export interface CreateSaleInput {
  locationId?: string;
  customerId?: string;
  items: CreateSaleItemInput[];
  payments: { method: PaymentMethod; amount: number; referenceNo?: string }[];
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const response = await apiClient.post<ApiResponse<SaleResponse>>("/api/sales", input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
    },
  });
}

export function useReverseSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<SaleResponse>>(`/api/sales/${id}/reverse`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
    },
  });
}
