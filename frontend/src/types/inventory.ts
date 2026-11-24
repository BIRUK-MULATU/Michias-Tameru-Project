export type StockMovementType =
  | "PURCHASE_RECEIPT"
  | "TRANSFER_DISPATCH"
  | "TRANSFER_RECEIPT"
  | "SALE"
  | "SALE_REVERSAL"
  | "RETURN_SELLABLE"
  | "DAMAGE"
  | "ADJUSTMENT_INCREASE"
  | "ADJUSTMENT_DECREASE"
  | "RECONCILIATION_VARIANCE";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface InventoryBalanceResponse {
  locationId: string;
  locationName: string;
  productVariantId: string;
  productName: string;
  sku: string;
  colorName: string;
  quantity: number;
  averageUnitCost: number;
  reorderLevel: number;
  belowReorderLevel: boolean;
}

export interface StockMovementResponse {
  id: string;
  locationId: string;
  locationName: string;
  productVariantId: string;
  productName: string;
  sku: string;
  movementType: StockMovementType;
  quantityDelta: number;
  unitCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  performedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface StockAdjustmentResponse {
  id: string;
  locationId: string;
  locationName: string;
  productVariantId: string;
  productName: string;
  sku: string;
  quantityDelta: number;
  reason: string;
  requestedBy: string;
  status: ApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
