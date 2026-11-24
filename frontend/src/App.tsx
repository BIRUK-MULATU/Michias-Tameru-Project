import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ComingSoon } from "@/components/ComingSoon";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminShell } from "@/components/layout/AdminShell";
import { SalesShell } from "@/components/layout/SalesShell";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { LocationsPage } from "@/pages/admin/LocationsPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { SalesDashboardPage } from "@/pages/sales/SalesDashboardPage";
import { useAuthStore } from "@/stores/auth-store";

function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ComingSoon title="Products" phase="Phase 3" />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="transfers" element={<ComingSoon title="Transfers" phase="Phase 4" />} />
          <Route path="sales" element={<ComingSoon title="Sales" phase="Phase 5" />} />
          <Route path="purchases" element={<ComingSoon title="Purchases" phase="Phase 6" />} />
          <Route path="expenses" element={<ComingSoon title="Expenses" phase="Phase 6" />} />
          <Route path="reports" element={<ComingSoon title="Reports" phase="Phase 7" />} />
          <Route path="users" element={<UsersPage />} />
          <Route
            path="audit-logs"
            element={<ComingSoon title="Activity Logs" phase="Phase 7" />}
          />
          <Route
            path="notifications"
            element={<ComingSoon title="Notifications" phase="Phase 4" />}
          />
        </Route>
      </Route>

      <Route element={<RequireAuth allowedRoles={["SALESPERSON"]} />}>
        <Route path="/pos" element={<SalesShell />}>
          <Route index element={<SalesDashboardPage />} />
          <Route path="sell" element={<ComingSoon title="Sell" phase="Phase 5" />} />
          <Route path="receive" element={<ComingSoon title="Receive stock" phase="Phase 4" />} />
          <Route path="returns" element={<ComingSoon title="Returns" phase="Phase 6" />} />
          <Route path="closing" element={<ComingSoon title="Daily closing" phase="Phase 6" />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
