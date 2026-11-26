import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
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
import { useInventoryBalancesForLocations } from "@/features/inventory/api";
import { useLocations } from "@/features/locations/api";
import { downloadInventoryExport, downloadSalesExport, useSalesSummary } from "@/features/reports/api";

const RANGE_OPTIONS: { label: string; days: number | "all" }[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: "all" },
];

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 text-slate-100 shadow-xl ring-1 ring-white/10 sm:rounded-3xl sm:p-6"
      style={{
        background:
          "radial-gradient(80% 60% at 0% 0%, color-mix(in oklch, var(--primary), transparent 91%) 0%, oklch(0.16 0.015 260) 38%)",
      }}
    >
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap text-slate-400 transition-colors hover:text-white",
        active && "bg-[color-mix(in_oklch,var(--primary),transparent_15%)] text-white shadow-sm",
      )}
    >
      {children}
    </button>
  );
}

function ExportButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Download className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

export function ReportsPage() {
  const { data: locations } = useLocations();
  const [locationId, setLocationId] = useState<string>("all");
  const [rangeDays, setRangeDays] = useState<number | "all">(30);
  const [trendType, setTrendType] = useState<ChartKind>("line");
  const [productsType, setProductsType] = useState<ChartKind>("bar");

  const effectiveLocationId = locationId === "all" ? undefined : locationId;

  const { from, to, prevFrom, prevTo } = useMemo(() => {
    if (rangeDays === "all") {
      return { from: undefined, to: undefined, prevFrom: undefined, prevTo: undefined };
    }
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

  const { data: summary, isLoading: summaryLoading } = useSalesSummary({
    locationId: effectiveLocationId,
    from,
    to,
  });
  const { data: previous } = useSalesSummary({
    locationId: effectiveLocationId,
    from: prevFrom,
    to: prevTo,
    enabled: rangeDays !== "all",
  });

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

  const revenueDelta = summary && previous ? pctChange(summary.totalRevenue, previous.totalRevenue) : null;
  const transactionsDelta =
    summary && previous ? pctChange(summary.totalTransactions, previous.totalTransactions) : null;
  const avgDelta =
    summary && previous ? pctChange(summary.averageTransactionValue, previous.averageTransactionValue) : null;
  const profitDelta = summary && previous ? pctChange(summary.grossProfit, previous.grossProfit) : null;
  const itemsDelta = summary && previous ? pctChange(summary.totalItemsSold, previous.totalItemsSold) : null;
  const marginPct = summary && summary.totalRevenue > 0 ? (summary.grossProfit / summary.totalRevenue) * 100 : null;

  const rangeLabel = useMemo(() => {
    if (rangeDays === "all" || !from || !to) return "All time";
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(new Date(from))} – ${fmt(new Date(to))}`;
  }, [rangeDays, from, to]);

  const inventoryLocationIds = useMemo(
    () => (effectiveLocationId ? [effectiveLocationId] : (locations?.map((l) => l.id) ?? [])),
    [effectiveLocationId, locations],
  );
  const { data: balances, isLoading: balancesLoading } = useInventoryBalancesForLocations(inventoryLocationIds);

  const totalStockValue = useMemo(
    () => balances.reduce((sum, b) => sum + b.quantity * b.averageUnitCost, 0),
    [balances],
  );
  const distinctSkuCount = useMemo(
    () => new Set(balances.map((b) => b.productVariantId)).size,
    [balances],
  );
  const lowStockItems = useMemo(
    () =>
      balances
        .filter((b) => b.belowReorderLevel)
        .sort((a, b) => a.quantity - a.reorderLevel - (b.quantity - b.reorderLevel)),
    [balances],
  );
  const valueByLocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balances) {
      map.set(b.locationName, (map.get(b.locationName) ?? 0) + b.quantity * b.averageUnitCost);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [balances]);

  const exportableLocations = useMemo(
    () => locations?.filter((l) => inventoryLocationIds.includes(l.id)) ?? [],
    [locations, inventoryLocationIds],
  );

  return (
    <div className="space-y-6">
      <PanelShell>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">Sales performance</p>
            <h2 className="mt-0.5 text-sm font-semibold text-white sm:text-base">Sales Report</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-black/20 p-0.5 ring-1 ring-white/10">
              <PillButton active={locationId === "all"} onClick={() => setLocationId("all")}>
                All locations
              </PillButton>
              {locations?.map((l) => (
                <PillButton key={l.id} active={locationId === l.id} onClick={() => setLocationId(l.id)}>
                  {l.name}
                </PillButton>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-black/20 p-0.5 ring-1 ring-white/10">
              {RANGE_OPTIONS.map((option) => (
                <PillButton
                  key={option.label}
                  active={rangeDays === option.days}
                  onClick={() => setRangeDays(option.days)}
                >
                  {option.label}
                </PillButton>
              ))}
            </div>
            <ExportButton onClick={() => downloadSalesExport({ locationId: effectiveLocationId, from, to }, "csv")}>
              CSV
            </ExportButton>
            <ExportButton onClick={() => downloadSalesExport({ locationId: effectiveLocationId, from, to }, "xlsx")}>
              Excel
            </ExportButton>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <KpiCard
            label="Total revenue"
            value={summary ? summary.totalRevenue.toFixed(2) : "—"}
            dotColor="var(--chart-1)"
            deltaPct={revenueDelta}
          />
          <KpiCard
            label="Transactions"
            value={summary ? String(summary.totalTransactions) : "—"}
            dotColor="var(--chart-4)"
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

        <p className="mt-4 text-[11px] text-slate-500">
          {rangeLabel} · {locationId === "all" ? "all locations" : locations?.find((l) => l.id === locationId)?.name}
          {rangeDays !== "all" && " · vs previous period shown as ▲/▼"}
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Revenue trend"
            description={rangeDays === "all" ? "Daily revenue" : `Daily revenue, last ${rangeDays} days`}
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
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
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

          <ChartCard title="Best-sellers detail" description="Exact figures for this period">
            <div className="max-h-[220px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#141b2d] text-slate-400">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {summary?.bestSellingProducts.map((p) => (
                    <tr key={p.sku} className="border-t border-white/5">
                      <td className="py-1.5 pr-2">
                        {p.productName} ({p.colorName})
                      </td>
                      <td className="py-1.5">{p.totalQuantity}</td>
                      <td className="py-1.5">{p.totalRevenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {summary?.bestSellingProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-500">
                        No sales in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </PanelShell>

      <PanelShell>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">Point-in-time snapshot</p>
            <h2 className="mt-0.5 text-sm font-semibold text-white sm:text-base">Inventory Report</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {exportableLocations.map((location) => (
              <div key={location.id} className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">{location.name}</span>
                <ExportButton onClick={() => downloadInventoryExport(location.id, "csv")}>CSV</ExportButton>
                <ExportButton onClick={() => downloadInventoryExport(location.id, "xlsx")}>Excel</ExportButton>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Total stock value"
            value={balancesLoading ? "—" : totalStockValue.toFixed(2)}
            dotColor="var(--chart-1)"
            deltaPct={null}
            hideDelta
            subLabel="at average unit cost"
          />
          <KpiCard
            label="Distinct SKUs"
            value={balancesLoading ? "—" : String(distinctSkuCount)}
            dotColor="var(--chart-4)"
            deltaPct={null}
            hideDelta
            subLabel={
              locationId === "all"
                ? `across ${inventoryLocationIds.length} location(s)`
                : "in this location"
            }
          />
          <KpiCard
            label="Low stock items"
            value={balancesLoading ? "—" : String(lowStockItems.length)}
            dotColor={lowStockItems.length > 0 ? "var(--destructive)" : "var(--chart-3)"}
            deltaPct={null}
            hideDelta
            subLabel="below reorder level"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Stock value by location"
            description="Quantity × average unit cost"
            empty={!balancesLoading && valueByLocation.every((row) => row.value === 0)}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={valueByLocation}>
                <CartesianGrid strokeDasharray="3 3" stroke={DARK_GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} />
                <YAxis tick={{ fontSize: 11, fill: DARK_AXIS }} stroke={DARK_GRID} width={48} />
                <Tooltip contentStyle={DARK_TOOLTIP} formatter={formatMoney} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Low stock items"
            description="Needs restocking soon"
            empty={!balancesLoading && lowStockItems.length === 0}
            emptyMessage="Everything is above its reorder level."
          >
            <div className="max-h-[220px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#141b2d] text-slate-400">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">SKU</th>
                    {locationId === "all" && <th className="pb-2 font-medium">Location</th>}
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Reorder at</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {lowStockItems.map((item) => (
                    <tr key={`${item.locationId}-${item.productVariantId}`} className="border-t border-white/5">
                      <td className="py-1.5 pr-2">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          {item.sku}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {item.productName} ({item.colorName})
                        </span>
                      </td>
                      {locationId === "all" && <td className="py-1.5">{item.locationName}</td>}
                      <td className="py-1.5">{item.quantity}</td>
                      <td className="py-1.5">{item.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </PanelShell>
    </div>
  );
}
