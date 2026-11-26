import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ChartTypeToggle, type ChartKind } from "@/components/dashboard/ChartTypeToggle";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  DARK_AXIS,
  DARK_GRID,
  DARK_TOOLTIP,
  PALETTE,
  formatAxisDate,
  formatMoney,
  pctChange,
  startOfDaysAgo,
} from "@/lib/chart-utils";
import { cn } from "@/lib/utils";
import { useEmployeeComparison } from "@/features/employees/api";
import { useSalesSummary } from "@/features/reports/api";

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export function DashboardAnalytics() {
  const [rangeDays, setRangeDays] = useState(30);
  const [trendType, setTrendType] = useState<ChartKind>("line");
  const [productsType, setProductsType] = useState<ChartKind>("bar");
  const [employeeType, setEmployeeType] = useState<ChartKind>("bar");

  const { from, to, prevFrom, prevTo } = useMemo(() => {
    const now = new Date();
    const fromDate = startOfDaysAgo(rangeDays, now);
    const prevToDate = new Date(fromDate.getTime() - 1);
    const prevFromDate = startOfDaysAgo(rangeDays, prevToDate);
    return {
      from: fromDate.toISOString(),
      to: now.toISOString(),
      prevFrom: prevFromDate.toISOString(),
      prevTo: prevToDate.toISOString(),
    };
  }, [rangeDays]);

  const { data: summary, isLoading: summaryLoading } = useSalesSummary({ from, to, refetchIntervalMs: 60_000 });
  const { data: previous } = useSalesSummary({ from: prevFrom, to: prevTo });
  const { data: comparison, isLoading: comparisonLoading } = useEmployeeComparison();

  const trendData = useMemo(
    () =>
      summary?.dailyRevenue.map((row) => ({
        date: row.date,
        label: formatAxisDate(row.date),
        revenue: row.revenue,
      })) ?? [],
    [summary],
  );

  const paymentData = useMemo(() => {
    if (!summary) return [];
    const total = Object.values(summary.revenueByPaymentMethod).reduce((sum, v) => sum + v, 0);
    return Object.entries(summary.revenueByPaymentMethod)
      .map(([name, value]) => ({
        name: name.replaceAll("_", " "),
        value,
        share: total === 0 ? 0 : (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [summary]);

  const productsData = useMemo(
    () =>
      summary?.bestSellingProducts.slice(0, 5).map((row) => ({
        name: `${row.productName} (${row.colorName})`,
        quantity: row.totalQuantity,
        revenue: row.totalRevenue,
      })) ?? [],
    [summary],
  );

  const employeeData = useMemo(
    () =>
      comparison?.map((row) => ({
        name: row.fullName,
        revenue: row.totalRevenue,
      })) ?? [],
    [comparison],
  );

  const revenueDelta = summary && previous ? pctChange(summary.totalRevenue, previous.totalRevenue) : null;
  const transactionsDelta =
    summary && previous ? pctChange(summary.totalTransactions, previous.totalTransactions) : null;
  const avgDelta =
    summary && previous ? pctChange(summary.averageTransactionValue, previous.averageTransactionValue) : null;
  const profitDelta = summary && previous ? pctChange(summary.grossProfit, previous.grossProfit) : null;
  const itemsDelta = summary && previous ? pctChange(summary.totalItemsSold, previous.totalItemsSold) : null;
  const marginPct = summary && summary.totalRevenue > 0 ? (summary.grossProfit / summary.totalRevenue) * 100 : null;

  const rangeLabel = useMemo(() => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(fromDate)} – ${fmt(toDate)}`;
  }, [from, to]);

  return (
    <div
      className="rounded-2xl p-4 text-slate-100 shadow-xl ring-1 ring-white/10 sm:rounded-3xl sm:p-6"
      style={{
        background:
          "radial-gradient(80% 60% at 0% 0%, color-mix(in oklch, var(--primary), transparent 91%) 0%, oklch(0.16 0.015 260) 38%)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">Sales performance</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-white sm:text-base">
              Key Performance Indicators — {new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-black/20 p-0.5 ring-1 ring-white/10">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => setRangeDays(option.days)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-white",
                rangeDays === option.days &&
                  "bg-[color-mix(in_oklch,var(--primary),transparent_15%)] text-white shadow-sm",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">Total revenue</p>
          <p className="mt-1 text-3xl font-bold text-white sm:text-4xl">{summary ? summary.totalRevenue.toFixed(2) : "—"}</p>
          <p className="mt-1 text-xs">
            {revenueDelta !== null ? (
              <span className={cn("font-medium", revenueDelta >= 0 ? "text-emerald-400" : "text-red-400")}>
                {revenueDelta >= 0 ? "▲" : "▼"} {Math.abs(revenueDelta).toFixed(1)}%
              </span>
            ) : (
              <span className="text-slate-500">No prior period data</span>
            )}{" "}
            <span className="text-slate-500">vs previous {rangeDays} days</span>
          </p>
        </div>
        <div className="h-16 w-32 sm:w-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Transactions"
          value={summary ? String(summary.totalTransactions) : "—"}
          dotColor="var(--chart-1)"
          deltaPct={transactionsDelta}
        />
        <KpiCard
          label="Avg. transaction"
          value={summary ? summary.averageTransactionValue.toFixed(2) : "—"}
          dotColor="var(--chart-5)"
          deltaPct={avgDelta}
        />
        <KpiCard
          label="Gross profit"
          value={summary ? summary.grossProfit.toFixed(2) : "—"}
          dotColor="var(--chart-2)"
          deltaPct={profitDelta}
          subLabel={marginPct !== null ? `${marginPct.toFixed(1)}% margin` : undefined}
        />
        <KpiCard
          label="Items sold"
          value={summary ? String(summary.totalItemsSold) : "—"}
          dotColor="var(--chart-3)"
          deltaPct={itemsDelta}
        />
      </div>

      <p className="mt-4 text-[11px] text-slate-500">{rangeLabel} · refreshes automatically</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Revenue trend"
          description={`Daily revenue, last ${rangeDays} days`}
          action={<ChartTypeToggle value={trendType} onChange={setTrendType} options={["line", "bar"]} />}
          empty={!summaryLoading && trendData.every((row) => row.revenue === 0)}
          emptyMessage="No completed sales in this period."
        >
          <ResponsiveContainer width="100%" height={220}>
            {trendType === "line" ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={DARK_GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} />
                <YAxis tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} width={48} />
                <Tooltip contentStyle={DARK_TOOLTIP} formatter={formatMoney} />
                <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={DARK_GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} />
                <YAxis tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} width={48} />
                <Tooltip contentStyle={DARK_TOOLTIP} formatter={formatMoney} />
                <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revenue by payment method"
          description="Channel breakdown for this period"
          empty={!summaryLoading && paymentData.length === 0}
        >
          <div className="space-y-3">
            {paymentData.map((row, index) => (
              <div key={row.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                    />
                    {row.name}
                  </span>
                  <span className="font-medium text-white">{row.value.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.share}%`, backgroundColor: PALETTE[index % PALETTE.length] }}
                  />
                </div>
                <p className="text-right text-[11px] text-slate-500">{row.share.toFixed(1)}% of revenue</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Best-selling products"
          description={`Top ${productsData.length || 5} by quantity sold`}
          action={<ChartTypeToggle value={productsType} onChange={setProductsType} options={["bar", "pie"]} />}
          empty={!summaryLoading && productsData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            {productsType === "bar" ? (
              <BarChart data={productsData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={DARK_GRID} />
                <XAxis type="number" tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: DARK_AXIS }}
                  stroke={DARK_GRID}
                  width={120}
                />
                <Tooltip contentStyle={DARK_TOOLTIP} />
                <Bar dataKey="quantity" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            ) : (
              <PieChart>
                <Tooltip contentStyle={DARK_TOOLTIP} />
                <Pie data={productsData} dataKey="quantity" nameKey="name" outerRadius={85} paddingAngle={2}>
                  {productsData.map((entry, index) => (
                    <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Employee performance"
          description="Revenue per salesperson, all time"
          action={<ChartTypeToggle value={employeeType} onChange={setEmployeeType} options={["bar", "line"]} />}
          empty={!comparisonLoading && employeeData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            {employeeType === "bar" ? (
              <BarChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={DARK_GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} />
                <YAxis tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} width={48} />
                <Tooltip contentStyle={DARK_TOOLTIP} formatter={formatMoney} />
                <Bar dataKey="revenue" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={DARK_GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} />
                <YAxis tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} width={48} />
                <Tooltip contentStyle={DARK_TOOLTIP} formatter={formatMoney} />
                <Line type="monotone" dataKey="revenue" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
