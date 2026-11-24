export interface ExpenseResponse {
  id: string;
  locationId: string | null;
  locationName: string | null;
  category: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  recordedBy: string;
}
