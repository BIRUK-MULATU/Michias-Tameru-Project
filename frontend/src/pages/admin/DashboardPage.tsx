import { AlertTriangle, ReceiptText, Store, Users2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEmployeeComparison } from "@/features/employees/api";
import { useLocations } from "@/features/locations/api";
import { useSales } from "@/features/sales/api";
import { useUsers } from "@/features/users/api";
import { DashboardAnalytics } from "@/pages/admin/DashboardAnalytics";

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function DashboardPage() {
  const { data: locations } = useLocations();
  const { data: users } = useUsers();
  const { data: sales } = useSales();
  const { data: comparison } = useEmployeeComparison();

  const activeLocations = locations?.filter((location) => location.active).length ?? 0;
  const activeEmployees = users?.filter((user) => user.active).length ?? 0;
  const todaysSales = sales?.filter((sale) => sale.status === "COMPLETED" && isToday(sale.saleDate)) ?? [];
  const todaysTotal = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const openDiscrepancies = comparison?.reduce((sum, row) => sum + row.stockDiscrepancies, 0) ?? 0;
  const pendingApprovals = comparison?.reduce((sum, row) => sum + row.pendingReturnRequests, 0) ?? 0;

  const needsAttention = openDiscrepancies + pendingApprovals > 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening across your business today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active locations
            </CardTitle>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--chart-1),white_85%)] text-[color-mix(in_oklch,var(--chart-1),black_10%)]">
              <Store className="h-4.5 w-4.5" />
            </span>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{activeLocations}</CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active employees
            </CardTitle>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--chart-5),white_85%)] text-[color-mix(in_oklch,var(--chart-5),black_10%)]">
              <Users2 className="h-4.5 w-4.5" />
            </span>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{activeEmployees}</CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sales today (all locations)
            </CardTitle>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--chart-2),white_85%)] text-[color-mix(in_oklch,var(--chart-2),black_10%)]">
              <ReceiptText className="h-4.5 w-4.5" />
            </span>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2 text-3xl font-semibold tabular-nums">
            {todaysTotal.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">
              {todaysSales.length} sale{todaysSales.length === 1 ? "" : "s"}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(needsAttention && "border-amber-500/30 bg-amber-500/[0.03]")}>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              needsAttention ? "text-amber-500" : "text-muted-foreground",
            )}
          />
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">{openDiscrepancies}</span> open stock discrepancy
            {openDiscrepancies === 1 ? "" : "ies"} across daily closings —{" "}
            <Link to="/admin/monitoring" className="text-primary hover:underline">
              view monitoring
            </Link>
            .
          </p>
          <p>
            <span className="font-medium">{pendingApprovals}</span> pending return request
            {pendingApprovals === 1 ? "" : "s"} —{" "}
            <Link to="/admin/returns" className="text-primary hover:underline">
              review returns
            </Link>
            .
          </p>
          <p>
            <Link to="/admin/reports" className="text-primary hover:underline">
              Full sales and inventory reports →
            </Link>
          </p>
        </CardContent>
      </Card>

      <DashboardAnalytics />
    </div>
  );
}
