export type UnitOfMeasure = "PIECE" | "METER";

export interface BrandResponse {
  id: string;
  name: string;
  active: boolean;
}

export interface CategoryResponse {
  id: string;
  name: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  active: boolean;
}

export interface ProductResponse {
  id: string;
  name: string;
  brandId: string | null;
  brandName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unitOfMeasure: UnitOfMeasure;
  description: string | null;
  active: boolean;
}

export interface ProductVariantResponse {
  id: string;
  productId: string;
  productName: string;
  brandName: string | null;
  sku: string;
  colorName: string;
  shadeCode: string | null;
  defaultSalePrice: number;
  reorderLevel: number;
  active: boolean;
}
