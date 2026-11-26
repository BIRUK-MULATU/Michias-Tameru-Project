import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useReverseSale, useSales } from "@/features/sales/api";
import type { SaleResponse } from "@/types/sale";

function SaleDetailDialog({ sale }: { sale: SaleResponse }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{sale.saleNumber}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.productName} ({item.colorName})
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unitPrice.toFixed(2)}</TableCell>
                <TableCell>{item.lineTotal.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between border-t pt-2 text-sm">
          <span className="text-muted-foreground">
            Paid via {sale.payments.map((p) => p.method).join(", ")}
          </span>
          <span className="font-semibold">Total {sale.totalAmount.toFixed(2)}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SalesPage() {
  const { data: locations } = useLocations();
  const [locationId, setLocationId] = useState<string>("all");
  const { data: sales, isLoading } = useSales({
    locationId: locationId === "all" ? undefined : locationId,
  });
  const reverseSale = useReverseSale();

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Sales</CardTitle>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations?.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale #</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {sales?.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-sm">{sale.saleNumber}</TableCell>
                <TableCell>{sale.locationName}</TableCell>
                <TableCell>{new Date(sale.saleDate).toLocaleString()}</TableCell>
                <TableCell>{sale.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={sale.status === "COMPLETED" ? "default" : "destructive"}>
                    {sale.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <SaleDetailDialog sale={sale} />
                  {sale.status === "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reverseSale.mutate(sale.id)}
                      disabled={reverseSale.isPending}
                    >
                      Reverse
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
