import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { LocationResponse, LocationType } from "@/types/location";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<LocationResponse[]>>("/api/locations");
      return response.data.data;
    },
  });
}

export interface LocationInput {
  name: string;
  type: LocationType;
  address?: string;
  active: boolean;
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LocationInput) => {
      const response = await apiClient.post<ApiResponse<LocationResponse>>("/api/locations", input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: LocationInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<LocationResponse>>(
        `/api/locations/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
}
