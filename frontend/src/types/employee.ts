export interface EmployeeSummaryResponse {
  id: string;
  username: string;
  fullName: string;
  locationId: string | null;
  locationName: string | null;
  active: boolean;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  lastActivityLogAt: string | null;
  totalReceivedQty: number;
  totalSoldQty: number;
  totalReturnedQty: number;
  currentLocationStockQty: number;
  totalRevenue: number;
  totalTransactions: number;
  pendingReturnRequests: number;
  pendingAdjustmentRequests: number;
}

export interface EmployeeComparisonRow {
  userId: string;
  username: string;
  fullName: string;
  locationName: string | null;
  totalRevenue: number;
  totalTransactions: number;
  totalQuantitySold: number;
  averageTransactionValue: number;
  pendingReturnRequests: number;
  stockDiscrepancies: number;
}

export interface DailyRevenueRow {
  date: string;
  revenue: number;
  transactions: number;
}

export interface EmployeePerformanceResponse {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  revenueByPaymentMethod: Record<string, number>;
  bestSellingProducts: {
    productName: string;
    sku: string;
    colorName: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  dailyRevenue: DailyRevenueRow[];
}
