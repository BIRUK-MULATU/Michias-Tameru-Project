import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

export function SalesDashboardPage() {
  const user = useAuthStore((state) => state.user);

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
        <CardContent className="text-sm text-muted-foreground">
          POS and stock receiving arrive in Phase 5. Nothing to show yet.
        </CardContent>
      </Card>
    </div>
  );
}
