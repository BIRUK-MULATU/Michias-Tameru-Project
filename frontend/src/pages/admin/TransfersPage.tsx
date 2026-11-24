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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useCancelTransfer,
  useCreateTransfer,
  useDispatchTransfer,
  useTransfers,
} from "@/features/transfers/api";
import type { TransferResponse, TransferStatus } from "@/types/transfer";

function statusVariant(status: TransferStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "RECEIVED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "DRAFT":
      return "outline";
    default:
      return "secondary";
  }
}

const transferSchema = z.object({
  fromLocationId: z.string().min(1, "Required"),
  toLocationId: z.string().min(1, "Required"),
  items: z
    .array(
      z.object({
        productVariantId: z.string().min(1, "Required"),
        quantity: z.coerce.number().positive("Must be greater than 0"),
      }),
    )
    .min(1, "Add at least one item"),
});

type TransferFormInput = z.input<typeof transferSchema>;
type TransferForm = z.output<typeof transferSchema>;

function CreateTransferDialog() {
  const [open, setOpen] = useState(false);
  const { data: locations } = useLocations();
  const { data: variants } = useProductVariants();
  const createTransfer = useCreateTransfer();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormInput, unknown, TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: { items: [{ productVariantId: "", quantity: undefined }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: TransferForm) {
    await createTransfer.mutateAsync(values);
    reset({ items: [{ productVariantId: "", quantity: undefined }] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create transfer</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create stock transfer</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select onValueChange={(value) => setValue("fromLocationId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fromLocationId && (
                <p className="text-sm text-destructive">{errors.fromLocationId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select onValueChange={(value) => setValue("toLocationId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.toLocationId && (
                <p className="text-sm text-destructive">{errors.toLocationId.message}</p>
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
                    {variants?.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.productName} — {variant.colorName} ({variant.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="1"
                  placeholder="Qty"
                  className="w-24"
                  {...register(`items.${index}.quantity`)}
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
              onClick={() => append({ productVariantId: "", quantity: undefined })}
            >
              Add item
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create transfer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransferDetailDialog({ transfer }: { transfer: TransferResponse }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {transfer.fromLocationName} → {transfer.toLocationName}
          </DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Dispatched</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfer.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>{item.quantityDispatched}</TableCell>
                <TableCell>{item.quantityReceived}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.discrepancyNote ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

export function TransfersPage() {
  const { data: transfers, isLoading } = useTransfers();
  const dispatchTransfer = useDispatchTransfer();
  const cancelTransfer = useCancelTransfer();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Transfers</CardTitle>
        <CreateTransferDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
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
            {transfers?.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{transfer.fromLocationName}</TableCell>
                <TableCell>{transfer.toLocationName}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(transfer.status)}>{transfer.status}</Badge>
                </TableCell>
                <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="flex gap-2">
                  <TransferDetailDialog transfer={transfer} />
                  {transfer.status === "DRAFT" && (
                    <>
                      <Button size="sm" onClick={() => dispatchTransfer.mutate(transfer.id)}>
                        Dispatch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelTransfer.mutate(transfer.id)}
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
