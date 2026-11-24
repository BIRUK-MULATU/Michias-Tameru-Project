export type TransferStatus = "DRAFT" | "DISPATCHED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export interface TransferItemResponse {
  id: string;
  productVariantId: string;
  productName: string;
  sku: string;
  colorName: string;
  quantityDispatched: number;
  quantityReceived: number;
  outstandingQuantity: number;
  unitCostAtDispatch: number | null;
  discrepancyNote: string | null;
}

export interface TransferResponse {
  id: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  status: TransferStatus;
  createdBy: string;
  dispatchedBy: string | null;
  dispatchedAt: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  createdAt: string;
  items: TransferItemResponse[];
}
