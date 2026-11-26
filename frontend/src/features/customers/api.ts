import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { CustomerResponse } from "@/types/customer";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CustomerResponse[]>>("/api/customers");
      return response.data.data;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone?: string }) => {
      const response = await apiClient.post<ApiResponse<CustomerResponse>>("/api/customers", input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export interface UpdateCustomerInput {
  name: string;
  phone?: string;
  active: boolean;
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCustomerInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<CustomerResponse>>(
        `/api/customers/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
