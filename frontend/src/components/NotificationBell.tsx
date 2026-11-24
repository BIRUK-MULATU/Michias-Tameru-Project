import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarkNotificationRead, useNotifications } from "@/features/notifications/api";

export function NotificationBell() {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(!notifications || notifications.length === 0) && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications.</div>
        )}
        {notifications?.slice(0, 10).map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="flex flex-col items-start gap-0.5 whitespace-normal"
            onSelect={() => !n.read && markRead.mutate(n.id)}
          >
            <span className={n.read ? "text-muted-foreground" : "font-medium"}>{n.title}</span>
            <span className="text-xs text-muted-foreground">{n.message}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
