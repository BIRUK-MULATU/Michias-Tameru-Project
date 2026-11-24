import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { ExpenseResponse } from "@/types/expense";

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ExpenseResponse[]>>("/api/expenses");
      return response.data.data;
    },
  });
}

export interface CreateExpenseInput {
  locationId?: string;
  category: string;
  amount: number;
  description?: string;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const response = await apiClient.post<ApiResponse<ExpenseResponse>>("/api/expenses", input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
