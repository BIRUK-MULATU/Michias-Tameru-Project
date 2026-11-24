import { useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useEmployee,
  useEmployeeActivities,
  useEmployeeInventory,
  useEmployeePerformance,
  useEmployeeSales,
  useEmployeeStockMovements,
} from "@/features/employees/api";

type Tab = "overview" | "inventory" | "sales" | "performance" | "movements" | "activities";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "inventory", label: "Inventory Accountability" },
  { id: "sales", label: "Sales History" },
  { id: "performance", label: "Performance" },
  { id: "movements", label: "Stock Movements" },
  { id: "activities", label: "Activity" },
];

function OverviewTab({ id }: { id: string }) {
  const { data: employee } = useEmployee(id);
  if (!employee) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Total received", employee.totalReceivedQty],
        ["Total sold", employee.totalSoldQty],
        ["Total returned", employee.totalReturnedQty],
        ["Current stock", employee.currentLocationStockQty],
        ["Total revenue", employee.totalRevenue.toFixed(2)],
        ["Total transactions", employee.totalTransactions],
        ["Pending returns", employee.pendingReturnRequests],
        ["Pending adjustments", employee.pendingAdjustmentRequests],
      ].map(([label, value]) => (
        <Card key={label as string}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{value}</CardContent>
        </Card>
      ))}
    </div>
  );
}

function InventoryTab({ id }: { id: string }) {
  const { data } = useEmployeeInventory(id);
  if (!data) return <p className="text-sm text-muted-foreground">No location assigned.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Opening</TableHead>
          <TableHead>Received</TableHead>
          <TableHead>Sold</TableHead>
          <TableHead>Sellable returns</TableHead>
          <TableHead>Adjustments</TableHead>
          <TableHead>Expected</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.items.map((item) => (
          <TableRow key={item.productVariantId}>
            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
            <TableCell>{item.openingQty}</TableCell>
            <TableCell>{item.receivedQty}</TableCell>
            <TableCell>{item.soldQty}</TableCell>
            <TableCell>{item.sellableReturnQty}</TableCell>
            <TableCell>{item.approvedAdjustmentQty}</TableCell>
            <TableCell className="font-medium">{item.expectedQty}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SalesTab({ id }: { id: string }) {
  const { data: sales } = useEmployeeSales(id);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sale #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales?.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell className="font-mono text-sm">{sale.saleNumber}</TableCell>
            <TableCell>{new Date(sale.saleDate).toLocaleString()}</TableCell>
            <TableCell>{sale.totalAmount.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={sale.status === "COMPLETED" ? "default" : "destructive"}>{sale.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PerformanceTab({ id }: { id: string }) {
  const { data } = useEmployeePerformance(id);
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-xl font-semibold">{data.totalRevenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Transactions</p>
          <p className="text-xl font-semibold">{data.totalTransactions}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avg. transaction</p>
          <p className="text-xl font-semibold">{data.averageTransactionValue.toFixed(2)}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Best-selling products</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.bestSellingProducts.map((p) => (
              <TableRow key={p.sku}>
                <TableCell>
                  {p.productName} ({p.colorName})
                </TableCell>
                <TableCell>{p.totalQuantity}</TableCell>
                <TableCell>{p.totalRevenue.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MovementsTab({ id }: { id: string }) {
  const { data } = useEmployeeStockMovements(id);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.content.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="text-sm">{new Date(m.createdAt).toLocaleString()}</TableCell>
            <TableCell>{m.locationName}</TableCell>
            <TableCell className="font-mono text-sm">{m.sku}</TableCell>
            <TableCell>{m.movementType}</TableCell>
            <TableCell>{m.quantityDelta > 0 ? "+" : ""}{m.quantityDelta}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ActivitiesTab({ id }: { id: string }) {
  const { data } = useEmployeeActivities(id);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.content.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
            <TableCell>{log.module}</TableCell>
            <TableCell>{log.actionType}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{log.description ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const { data: employee } = useEmployee(id);

  if (!id) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{employee?.fullName ?? "Employee"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {employee?.username} · {employee?.locationName ?? "Unassigned"}
          </p>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm",
              tab === t.id
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {tab === "overview" && <OverviewTab id={id} />}
          {tab === "inventory" && <InventoryTab id={id} />}
          {tab === "sales" && <SalesTab id={id} />}
          {tab === "performance" && <PerformanceTab id={id} />}
          {tab === "movements" && <MovementsTab id={id} />}
          {tab === "activities" && <ActivitiesTab id={id} />}
        </CardContent>
      </Card>
    </div>
  );
}
