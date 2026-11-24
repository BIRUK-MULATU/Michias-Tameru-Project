import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  useApproveAdjustment,
  useInventoryBalances,
  useRejectAdjustment,
  useRequestAdjustment,
  useStockAdjustments,
} from "@/features/inventory/api";
import { useProductVariants } from "@/features/products/api";

const adjustmentSchema = z.object({
  productVariantId: z.string().min(1, "Required"),
  quantityDelta: z.coerce.number().refine((v) => v !== 0, "Must not be zero"),
  reason: z.string().min(1, "Required"),
});

type AdjustmentFormInput = z.input<typeof adjustmentSchema>;
type AdjustmentForm = z.output<typeof adjustmentSchema>;

function RequestAdjustmentDialog({ locationId }: { locationId: string }) {
  const [open, setOpen] = useState(false);
  const { data: variants } = useProductVariants();
  const requestAdjustment = useRequestAdjustment();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormInput, unknown, AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
  });

  async function onSubmit(values: AdjustmentForm) {
    await requestAdjustment.mutateAsync({ ...values, locationId });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Request adjustment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request stock adjustment</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Product / color</Label>
            <Select onValueChange={(value) => setValue("productVariantId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a SKU" />
              </SelectTrigger>
              <SelectContent>
                {variants?.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.productName} — {variant.colorName} ({variant.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productVariantId && (
              <p className="text-sm text-destructive">{errors.productVariantId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-qty">Quantity change (negative to remove)</Label>
            <Input id="adj-qty" type="number" step="0.001" {...register("quantityDelta")} />
            {errors.quantityDelta && (
              <p className="text-sm text-destructive">{errors.quantityDelta.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-reason">Reason</Label>
            <Input id="adj-reason" {...register("reason")} />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit for approval"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendingAdjustments({ locationId }: { locationId?: string }) {
  const { data: adjustments } = useStockAdjustments(locationId);
  const approve = useApproveAdjustment();
  const reject = useRejectAdjustment();
  const pending = adjustments?.filter((a) => a.status === "PENDING") ?? [];

  if (pending.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending adjustment requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>{adjustment.locationName}</TableCell>
                <TableCell className="font-mono text-sm">{adjustment.sku}</TableCell>
                <TableCell>{adjustment.quantityDelta > 0 ? "+" : ""}{adjustment.quantityDelta}</TableCell>
                <TableCell>{adjustment.reason}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" onClick={() => approve.mutate(adjustment.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject.mutate(adjustment.id)}>
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function InventoryPage() {
  const { data: locations } = useLocations();
  const [locationId, setLocationId] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data: balances, isLoading } = useInventoryBalances(locationId, search);

  useEffect(() => {
    if (!locationId && locations && locations.length > 0) {
      setLocationId(locations[0].id);
    }
  }, [locations, locationId]);

  return (
    <div className="space-y-6">
      <PendingAdjustments />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Inventory</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            {locationId && <RequestAdjustmentDialog locationId={locationId} />}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Avg. unit cost</TableHead>
                <TableHead>Status</TableHead>
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
              {balances?.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No stock at this location yet.
                  </TableCell>
                </TableRow>
              )}
              {balances?.map((balance) => (
                <TableRow key={balance.productVariantId}>
                  <TableCell className="font-medium">{balance.productName}</TableCell>
                  <TableCell>{balance.colorName}</TableCell>
                  <TableCell className="font-mono text-sm">{balance.sku}</TableCell>
                  <TableCell>{balance.quantity}</TableCell>
                  <TableCell>{balance.averageUnitCost.toFixed(2)}</TableCell>
                  <TableCell>
                    {balance.belowReorderLevel ? (
                      <Badge variant="destructive">Below reorder</Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
