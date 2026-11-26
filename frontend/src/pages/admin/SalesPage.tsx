import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Eye,
  Landmark,
  ReceiptText,
  RotateCcw,
  Smartphone,
  Store,
  TrendingUp,
  Warehouse,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useLocations } from "@/features/locations/api";
import { useReverseSale, useSales } from "@/features/sales/api";
import type { LocationType } from "@/types/location";
import type { PaymentMethod, SaleResponse } from "@/types/sale";

const LOCATION_ICON: Record<LocationType, typeof Warehouse> = {
  WAREHOUSE: Warehouse,
  SHOP: Store,
};

const LOCATION_CHIP_COLOR: Record<LocationType, string> = {
  WAREHOUSE: "var(--chart-1)",
  SHOP: "var(--chart-5)",
};

function chipStyle(color: string) {
  return {
    backgroundColor: `color-mix(in oklch, ${color}, white 85%)`,
    color: `color-mix(in oklch, ${color}, black 10%)`,
  };
}

function LocationChip({ name, type }: { name: string; type?: LocationType }) {
  const Icon = type ? LOCATION_ICON[type] : Store;
  const color = type ? LOCATION_CHIP_COLOR[type] : "var(--chart-5)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={chipStyle(color)}
    >
      <Icon className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}

const PAYMENT_META: Record<PaymentMethod, { icon: typeof Banknote; label: string; color: string }> = {
  CASH: { icon: Banknote, label: "Cash", color: "var(--chart-2)" },
  CARD: { icon: CreditCard, label: "Card", color: "var(--chart-1)" },
  MOBILE_MONEY: { icon: Smartphone, label: "Mobile money", color: "var(--chart-3)" },
  BANK_TRANSFER: { icon: Landmark, label: "Bank transfer", color: "var(--chart-5)" },
};

function PaymentBadges({ sale }: { sale: SaleResponse }) {
  const methods = Array.from(new Set(sale.payments.map((p) => p.method)));
  if (methods.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((method) => {
        const meta = PAYMENT_META[method];
        const Icon = meta.icon;
        return (
          <span
            key={method}
            title={meta.label}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={chipStyle(meta.color)}
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

function SaleDetailDialog({ sale }: { sale: SaleResponse }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/30 text-primary hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
            {sale.saleNumber}
          </DialogTitle>
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
        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <PaymentBadges sale={sale} />
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

  const locationTypeById = useMemo(() => {
    const map = new Map<string, LocationType>();
    locations?.forEach((location) => map.set(location.id, location.type));
    return map;
  }, [locations]);

  const stats = useMemo(() => {
    const completed = sales?.filter((s) => s.status === "COMPLETED") ?? [];
    const reversed = sales?.filter((s) => s.status === "REVERSED") ?? [];
    const revenue = completed.reduce((sum, s) => sum + s.totalAmount, 0);
    return { total: sales?.length ?? 0, revenue, reversedCount: reversed.length };
  }, [sales]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locationId === "all" ? "Sales (all locations)" : "Sales (this location)"}
            </CardTitle>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={chipStyle("var(--chart-1)")}
            >
              <ReceiptText className="h-4.5 w-4.5" />
            </span>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{stats.total}</CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (completed)</CardTitle>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={chipStyle("var(--chart-2)")}
            >
              <TrendingUp className="h-4.5 w-4.5" />
            </span>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{stats.revenue.toFixed(2)}</CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reversed</CardTitle>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={chipStyle("var(--destructive)")}
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </span>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{stats.reversedCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Sales</CardTitle>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  All locations
                </span>
              </SelectItem>
              {locations?.map((location) => {
                const Icon = LOCATION_ICON[location.type];
                return (
                  <SelectItem key={location.id} value={location.id}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {location.name}
                    </span>
                  </SelectItem>
                );
              })}
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
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {sales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-sm">{sale.saleNumber}</TableCell>
                  <TableCell>
                    <LocationChip name={sale.locationName} type={locationTypeById.get(sale.locationId)} />
                  </TableCell>
                  <TableCell>{new Date(sale.saleDate).toLocaleString()}</TableCell>
                  <TableCell>
                    <PaymentBadges sale={sale} />
                  </TableCell>
                  <TableCell className="font-medium">{sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={sale.status === "COMPLETED" ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {sale.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <SaleDetailDialog sale={sale} />
                    {sale.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reverseSale.mutate(sale.id)}
                        disabled={reverseSale.isPending}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reverse
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && sales?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className={cn("text-center text-muted-foreground")}>
                    No sales found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
