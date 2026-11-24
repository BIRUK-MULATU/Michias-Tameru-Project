import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { ReturnResponse } from "@/types/returns";

export function useReturns(params?: { locationId?: string }) {
  return useQuery({
    queryKey: ["returns", params?.locationId ?? "all"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ReturnResponse[]>>("/api/returns", { params });
      return response.data.data;
    },
  });
}

export interface CreateReturnInput {
  saleId: string;
  items: { saleItemId: string; quantity: number; condition: "SELLABLE" | "DAMAGED" }[];
}

function invalidateReturns(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["returns"] });
  queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReturnInput) => {
      const response = await apiClient.post<ApiResponse<ReturnResponse>>("/api/returns", input);
      return response.data.data;
    },
    onSuccess: () => invalidateReturns(queryClient),
  });
}

function useReturnDecision(action: "approve" | "reject") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<ReturnResponse>>(`/api/returns/${id}/${action}`);
      return response.data.data;
    },
    onSuccess: () => invalidateReturns(queryClient),
  });
}

export function useApproveReturn() {
  return useReturnDecision("approve");
}

export function useRejectReturn() {
  return useReturnDecision("reject");
}
