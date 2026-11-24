import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSales } from "@/features/sales/api";
import { useAuthStore } from "@/stores/auth-store";

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function SalesDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: sales } = useSales({ locationId: user?.locationId ?? undefined });

  const todaysSales = sales?.filter((sale) => sale.status === "COMPLETED" && isToday(sale.saleDate)) ?? [];
  const todaysTotal = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.fullName}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Assigned location: {user?.locationName ?? "Not assigned yet — contact an admin."}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s sales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{todaysTotal.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            {todaysSales.length} transaction{todaysSales.length === 1 ? "" : "s"} today
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
