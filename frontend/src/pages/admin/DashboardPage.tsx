import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active locations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{activeLocations}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active employees
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{activeEmployees}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sales today (all locations)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {todaysTotal.toFixed(2)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {todaysSales.length} sale{todaysSales.length === 1 ? "" : "s"}
            </span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
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
