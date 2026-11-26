import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocations } from "@/features/locations/api";
import { downloadInventoryExport, downloadSalesExport, useSalesSummary } from "@/features/reports/api";

export function ReportsPage() {
  const { data: locations } = useLocations();
  const [locationId, setLocationId] = useState<string>("all");
  const effectiveLocationId = locationId === "all" ? undefined : locationId;
  const { data: summary } = useSalesSummary({ locationId: effectiveLocationId });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Sales Report</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations?.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => downloadSalesExport(effectiveLocationId, "csv")}>
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadSalesExport(effectiveLocationId, "xlsx")}>
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total revenue</p>
              <p className="text-2xl font-semibold">{summary?.totalRevenue.toFixed(2) ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-semibold">{summary?.totalTransactions ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. transaction</p>
              <p className="text-2xl font-semibold">{summary?.averageTransactionValue.toFixed(2) ?? "—"}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Best-selling products</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty sold</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary?.bestSellingProducts.map((p) => (
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory Report</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {locations?.map((location) => (
            <div key={location.id} className="flex items-center gap-2 rounded-md border p-2">
              <span className="text-sm">{location.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadInventoryExport(location.id, "csv")}
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadInventoryExport(location.id, "xlsx")}
              >
                Excel
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
