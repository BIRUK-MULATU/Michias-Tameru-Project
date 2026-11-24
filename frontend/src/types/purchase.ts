export type PurchaseStatus = "DRAFT" | "RECEIVED" | "CANCELLED";

export interface SupplierResponse {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
}

export interface PurchaseItemResponse {
  id: string;
  productVariantId: string;
  productName: string;
  sku: string;
  colorName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseResponse {
  id: string;
  supplierId: string;
  supplierName: string;
  locationId: string;
  locationName: string;
  purchaseDate: string;
  status: PurchaseStatus;
  totalAmount: number;
  createdBy: string;
  receivedBy: string | null;
  receivedAt: string | null;
  items: PurchaseItemResponse[];
}
