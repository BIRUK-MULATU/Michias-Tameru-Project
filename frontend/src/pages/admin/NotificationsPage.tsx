import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarkNotificationRead, useNotifications } from "@/features/notifications/api";

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {notifications?.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications.</p>
        )}
        {notifications?.map((n) => (
          <div
            key={n.id}
            className="flex items-start justify-between gap-4 rounded-md border p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className={n.read ? "text-sm text-muted-foreground" : "text-sm font-medium"}>
                  {n.title}
                </p>
                {!n.read && <Badge variant="default">New</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!n.read && (
              <Button size="sm" variant="outline" onClick={() => markRead.mutate(n.id)}>
                Mark read
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
