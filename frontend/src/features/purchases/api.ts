import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { PurchaseResponse, SupplierResponse } from "@/types/purchase";

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SupplierResponse[]>>("/api/suppliers");
      return response.data.data;
    },
  });
}

export interface SupplierInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone?: string }) => {
      const response = await apiClient.post<ApiResponse<SupplierResponse>>("/api/suppliers", input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: SupplierInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<SupplierResponse>>(
        `/api/suppliers/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PurchaseResponse[]>>("/api/purchases");
      return response.data.data;
    },
  });
}

export interface CreatePurchaseInput {
  supplierId: string;
  locationId: string;
  items: { productVariantId: string; quantity: number; unitCost: number }[];
}

function invalidatePurchases(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["purchases"] });
  queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      const response = await apiClient.post<ApiResponse<PurchaseResponse>>("/api/purchases", input);
      return response.data.data;
    },
    onSuccess: () => invalidatePurchases(queryClient),
  });
}

export function useReceivePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<PurchaseResponse>>(`/api/purchases/${id}/receive`);
      return response.data.data;
    },
    onSuccess: () => invalidatePurchases(queryClient),
  });
}

export function useCancelPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<PurchaseResponse>>(`/api/purchases/${id}/cancel`);
      return response.data.data;
    },
    onSuccess: () => invalidatePurchases(queryClient),
  });
}
