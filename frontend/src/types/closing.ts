export type ClosingStatus = "SUBMITTED" | "REVIEWED";

export interface ClosingItemPreview {
  productVariantId: string;
  productName: string;
  sku: string;
  colorName: string;
  openingQty: number;
  receivedQty: number;
  soldQty: number;
  sellableReturnQty: number;
  approvedAdjustmentQty: number;
  expectedQty: number;
}

export interface ClosingPreviewResponse {
  locationId: string;
  locationName: string;
  periodStart: string;
  periodEnd: string;
  items: ClosingItemPreview[];
}

export interface ClosingItemResponse extends ClosingItemPreview {
  countedQty: number;
  discrepancyQty: number;
}

export interface ClosingResponse {
  id: string;
  locationId: string;
  locationName: string;
  submittedBy: string;
  periodStart: string;
  periodEnd: string;
  status: ClosingStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  items: ClosingItemResponse[];
}
