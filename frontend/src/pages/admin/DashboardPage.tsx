import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocations } from "@/features/locations/api";
import { useUsers } from "@/features/users/api";

export function DashboardPage() {
  const { data: locations } = useLocations();
  const { data: users } = useUsers();

  const activeLocations = locations?.filter((location) => location.active).length ?? 0;
  const activeEmployees = users?.filter((user) => user.active).length ?? 0;

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
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventory, sales, and financial analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Arrives with the Inventory (Phase 3), Sales/POS (Phase 5), and Reports (Phase 7)
          modules — this dashboard will not show fabricated figures before those modules exist.
        </CardContent>
      </Card>
    </div>
  );
}
