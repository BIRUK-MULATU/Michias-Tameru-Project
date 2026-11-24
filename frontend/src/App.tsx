import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminShell } from "@/components/layout/AdminShell";
import { SalesShell } from "@/components/layout/SalesShell";
import { LoginPage } from "@/pages/LoginPage";
import { ActivityLogsPage } from "@/pages/admin/ActivityLogsPage";
import { ClosingsPage } from "@/pages/admin/ClosingsPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { EmployeeDetailPage } from "@/pages/admin/EmployeeDetailPage";
import { EmployeesPage } from "@/pages/admin/EmployeesPage";
import { ExpensesPage } from "@/pages/admin/ExpensesPage";
import { InventoryPage } from "@/pages/admin/InventoryPage";
import { LocationsPage } from "@/pages/admin/LocationsPage";
import { NotificationsPage } from "@/pages/admin/NotificationsPage";
import { ProductsPage } from "@/pages/admin/ProductsPage";
import { PurchasesPage } from "@/pages/admin/PurchasesPage";
import { ReportsPage } from "@/pages/admin/ReportsPage";
import { ReturnsPage as AdminReturnsPage } from "@/pages/admin/ReturnsPage";
import { SalesPage } from "@/pages/admin/SalesPage";
import { TransfersPage } from "@/pages/admin/TransfersPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { ClosingPage } from "@/pages/sales/ClosingPage";
import { ReceivePage } from "@/pages/sales/ReceivePage";
import { ReturnsPage as SalesReturnsPage } from "@/pages/sales/ReturnsPage";
import { SalesDashboardPage } from "@/pages/sales/SalesDashboardPage";
import { SellPage } from "@/pages/sales/SellPage";
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
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="closings" element={<ClosingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="monitoring" element={<EmployeesPage />} />
          <Route path="monitoring/:id" element={<EmployeeDetailPage />} />
          <Route path="audit-logs" element={<ActivityLogsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowedRoles={["SALESPERSON"]} />}>
        <Route path="/pos" element={<SalesShell />}>
          <Route index element={<SalesDashboardPage />} />
          <Route path="sell" element={<SellPage />} />
          <Route path="receive" element={<ReceivePage />} />
          <Route path="returns" element={<SalesReturnsPage />} />
          <Route path="closing" element={<ClosingPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
