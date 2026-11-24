import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { useProductVariants } from "@/features/products/api";
import {
  useCancelPurchase,
  useCreatePurchase,
  useCreateSupplier,
  usePurchases,
  useReceivePurchase,
  useSuppliers,
} from "@/features/purchases/api";
import type { PurchaseResponse, PurchaseStatus } from "@/types/purchase";

function statusVariant(status: PurchaseStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "RECEIVED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

function AddSupplierDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createSupplier = useCreateSupplier();

  async function handleCreate() {
    if (!name.trim()) return;
    await createSupplier.mutateAsync({ name: name.trim() });
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add supplier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add supplier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Name</Label>
            <Input id="supplier-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={createSupplier.isPending}>
            Add supplier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Required"),
  locationId: z.string().min(1, "Required"),
  items: z
    .array(
      z.object({
        productVariantId: z.string().min(1, "Required"),
        quantity: z.coerce.number().positive(),
        unitCost: z.coerce.number().positive(),
      }),
    )
    .min(1, "Add at least one item"),
});

type PurchaseFormInput = z.input<typeof purchaseSchema>;
type PurchaseForm = z.output<typeof purchaseSchema>;

function CreatePurchaseDialog() {
  const [open, setOpen] = useState(false);
  const { data: suppliers } = useSuppliers();
  const { data: locations } = useLocations();
  const { data: variants } = useProductVariants();
  const createPurchase = useCreatePurchase();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormInput, unknown, PurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { items: [{ productVariantId: "", quantity: undefined, unitCost: undefined }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: PurchaseForm) {
    await createPurchase.mutateAsync(values);
    reset({ items: [{ productVariantId: "", quantity: undefined, unitCost: undefined }] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create purchase</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create purchase</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select onValueChange={(value) => setValue("supplierId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <p className="text-sm text-destructive">{errors.supplierId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Receiving location</Label>
              <Select onValueChange={(value) => setValue("locationId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationId && (
                <p className="text-sm text-destructive">{errors.locationId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Select onValueChange={(value) => setValue(`items.${index}.productVariantId`, value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="SKU / color" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.productName} — {v.colorName} ({v.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="1"
                  placeholder="Qty"
                  className="w-20"
                  {...register(`items.${index}.quantity`)}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Unit cost"
                  className="w-28"
                  {...register(`items.${index}.unitCost`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.items?.message && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productVariantId: "", quantity: undefined, unitCost: undefined })}
            >
              Add item
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create purchase"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseDetailDialog({ purchase }: { purchase: PurchaseResponse }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{purchase.supplierName}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit cost</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unitCost.toFixed(2)}</TableCell>
                <TableCell>{item.lineTotal.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

export function PurchasesPage() {
  const { data: purchases, isLoading } = usePurchases();
  const receivePurchase = useReceivePurchase();
  const cancelPurchase = useCancelPurchase();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Purchases</CardTitle>
        <div className="flex gap-2">
          <AddSupplierDialog />
          <CreatePurchaseDialog />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {purchases?.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.supplierName}</TableCell>
                <TableCell>{purchase.locationName}</TableCell>
                <TableCell>{purchase.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(purchase.status)}>{purchase.status}</Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <PurchaseDetailDialog purchase={purchase} />
                  {purchase.status === "DRAFT" && (
                    <>
                      <Button size="sm" onClick={() => receivePurchase.mutate(purchase.id)}>
                        Receive
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelPurchase.mutate(purchase.id)}
                      >
                        Cancel
                      </Button>
                    </>
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
