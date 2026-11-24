export type ReturnCondition = "SELLABLE" | "DAMAGED";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReturnItemResponse {
  id: string;
  saleItemId: string;
  productName: string;
  sku: string;
  colorName: string;
  quantity: number;
  condition: ReturnCondition;
}

export interface ReturnResponse {
  id: string;
  originalSaleId: string;
  originalSaleNumber: string;
  locationId: string;
  locationName: string;
  processedBy: string;
  approvedBy: string | null;
  status: ApprovalStatus;
  returnDate: string;
  items: ReturnItemResponse[];
}
