import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { LocationResponse } from "@/types/location";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<LocationResponse[]>>("/api/locations");
      return response.data.data;
    },
  });
}
