import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  BrandResponse,
  CategoryResponse,
  ProductResponse,
  ProductVariantResponse,
  UnitOfMeasure,
} from "@/types/product";
import type { ApiResponse } from "@/types/api";

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BrandResponse[]>>("/api/brands");
      return response.data.data;
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post<ApiResponse<BrandResponse>>("/api/brands", { name });
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export interface UpdateBrandInput {
  name: string;
  active: boolean;
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateBrandInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<BrandResponse>>(`/api/brands/${id}`, input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CategoryResponse[]>>("/api/categories");
      return response.data.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post<ApiResponse<CategoryResponse>>("/api/categories", { name });
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export interface UpdateCategoryInput {
  name: string;
  parentCategoryId?: string | null;
  active: boolean;
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCategoryInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<CategoryResponse>>(
        `/api/categories/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ProductResponse[]>>("/api/products");
      return response.data.data;
    },
  });
}

export interface CreateProductInput {
  name: string;
  brandId?: string;
  categoryId?: string;
  unitOfMeasure: UnitOfMeasure;
  description?: string;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const response = await apiClient.post<ApiResponse<ProductResponse>>("/api/products", input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export interface UpdateProductInput extends CreateProductInput {
  active: boolean;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProductInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<ProductResponse>>(
        `/api/products/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useProductVariants(search?: string) {
  return useQuery({
    queryKey: ["product-variants", search ?? ""],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ProductVariantResponse[]>>(
        "/api/products/variants",
        { params: { search } },
      );
      return response.data.data;
    },
  });
}

export interface CreateVariantInput {
  productId: string;
  sku: string;
  colorName: string;
  shadeCode?: string;
  defaultSalePrice: number;
  reorderLevel?: number;
}

export function useCreateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVariantInput) => {
      const { productId, ...body } = input;
      const response = await apiClient.post<ApiResponse<ProductVariantResponse>>(
        `/api/products/${productId}/variants`,
        body,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-variants"] }),
  });
}

export interface UpdateVariantInput {
  sku: string;
  colorName: string;
  shadeCode?: string;
  defaultSalePrice: number;
  reorderLevel?: number;
  active: boolean;
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateVariantInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<ProductVariantResponse>>(
        `/api/products/variants/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-variants"] }),
  });
}
