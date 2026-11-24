import { Home, ShoppingCart, PackagePlus, Undo2, ClipboardCheck, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { to: "/pos", label: "Home", icon: Home, end: true },
  { to: "/pos/sell", label: "Sell", icon: ShoppingCart },
  { to: "/pos/receive", label: "Receive", icon: PackagePlus },
  { to: "/pos/returns", label: "Returns", icon: Undo2 },
  { to: "/pos/closing", label: "Closing", icon: ClipboardCheck },
];

export function SalesShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div>
          <p className="text-sm font-semibold leading-tight">
            {user?.locationName ?? "Thread IMS"}
          </p>
          <p className="text-xs leading-tight text-muted-foreground">{user?.fullName}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-auto p-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-background">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
