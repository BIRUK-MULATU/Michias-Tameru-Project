export const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export const DARK_GRID = "rgba(255,255,255,0.08)";
export const DARK_AXIS = "rgba(226,232,240,0.5)";

export const DARK_TOOLTIP = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};

export function startOfDaysAgo(days: number, anchor: Date): Date {
  const date = new Date(anchor);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

export function formatAxisDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatMoney(value: unknown): string {
  const num = Array.isArray(value) ? Number(value[0]) : Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100;
  return ((current - previous) / previous) * 100;
}
