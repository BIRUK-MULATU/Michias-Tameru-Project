import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { TransferResponse, TransferStatus } from "@/types/transfer";

export function useTransfers(params?: { locationId?: string; status?: TransferStatus }) {
  return useQuery({
    queryKey: ["transfers", params?.locationId ?? "all", params?.status ?? "any"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TransferResponse[]>>("/api/transfers", {
        params,
      });
      return response.data.data;
    },
  });
}

export interface CreateTransferItemInput {
  productVariantId: string;
  quantity: number;
}

export interface CreateTransferInput {
  fromLocationId: string;
  toLocationId: string;
  items: CreateTransferItemInput[];
}

function invalidateTransfers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["transfers"] });
  queryClient.invalidateQueries({ queryKey: ["inventory-balances"] });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const response = await apiClient.post<ApiResponse<TransferResponse>>("/api/transfers", input);
      return response.data.data;
    },
    onSuccess: () => invalidateTransfers(queryClient),
  });
}

export function useDispatchTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<TransferResponse>>(`/api/transfers/${id}/dispatch`);
      return response.data.data;
    },
    onSuccess: () => invalidateTransfers(queryClient),
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<TransferResponse>>(`/api/transfers/${id}/cancel`);
      return response.data.data;
    },
    onSuccess: () => invalidateTransfers(queryClient),
  });
}

export interface ReceiveTransferInput {
  id: string;
  items: { transferItemId: string; quantityReceived: number }[];
}

export function useReceiveTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, items }: ReceiveTransferInput) => {
      const response = await apiClient.post<ApiResponse<TransferResponse>>(
        `/api/transfers/${id}/receive`,
        { items },
      );
      return response.data.data;
    },
    onSuccess: () => invalidateTransfers(queryClient),
  });
}

export interface CloseTransferInput {
  id: string;
  items?: { transferItemId: string; discrepancyNote?: string }[];
}

export function useCloseTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, items }: CloseTransferInput) => {
      const response = await apiClient.post<ApiResponse<TransferResponse>>(`/api/transfers/${id}/close`, {
        items,
      });
      return response.data.data;
    },
    onSuccess: () => invalidateTransfers(queryClient),
  });
}
