export interface ProductSalesRow {
  productName: string;
  sku: string;
  colorName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SalesReportResponse {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  revenueByPaymentMethod: Record<string, number>;
  bestSellingProducts: ProductSalesRow[];
}
