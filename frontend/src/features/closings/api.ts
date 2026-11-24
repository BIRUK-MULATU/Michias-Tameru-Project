import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { ClosingPreviewResponse, ClosingResponse } from "@/types/closing";

export function useClosingPreview(locationId?: string) {
  return useQuery({
    queryKey: ["closing-preview", locationId ?? "own"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ClosingPreviewResponse>>("/api/closings/preview", {
        params: { locationId },
      });
      return response.data.data;
    },
  });
}

export function useClosings(params?: { locationId?: string }) {
  return useQuery({
    queryKey: ["closings", params?.locationId ?? "all"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ClosingResponse[]>>("/api/closings", { params });
      return response.data.data;
    },
  });
}

export interface SubmitClosingInput {
  locationId?: string;
  items: { productVariantId: string; countedQty: number }[];
}

export function useSubmitClosing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitClosingInput) => {
      const response = await apiClient.post<ApiResponse<ClosingResponse>>("/api/closings", input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closings"] });
      queryClient.invalidateQueries({ queryKey: ["closing-preview"] });
    },
  });
}

export function useReviewClosing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<ClosingResponse>>(`/api/closings/${id}/review`);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["closings"] }),
  });
}
