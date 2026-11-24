export type SaleStatus = "COMPLETED" | "REVERSED";
export type PaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CARD";

export interface SaleItemResponse {
  id: string;
  productVariantId: string;
  productName: string;
  sku: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  unitCostAtSale: number | null;
}

export interface PaymentResponse {
  id: string;
  method: PaymentMethod;
  amount: number;
  referenceNo: string | null;
  paidAt: string;
}

export interface SaleResponse {
  id: string;
  saleNumber: string;
  locationId: string;
  locationName: string;
  customerId: string | null;
  customerName: string | null;
  salespersonUserId: string;
  saleDate: string;
  status: SaleStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  reversedBy: string | null;
  reversedAt: string | null;
  items: SaleItemResponse[];
  payments: PaymentResponse[];
}
