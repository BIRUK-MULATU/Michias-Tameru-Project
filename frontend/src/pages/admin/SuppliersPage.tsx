import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from "@/features/purchases/api";
import type { SupplierResponse } from "@/types/purchase";

const supplierSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  address: z.string().optional(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

function SupplierFormDialog({
  supplier,
  trigger,
}: {
  supplier?: SupplierResponse;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  function defaults(): SupplierForm {
    return supplier
      ? {
          name: supplier.name,
          phone: supplier.phone ?? "",
          email: supplier.email ?? "",
          address: supplier.address ?? "",
        }
      : { name: "", phone: "", email: "", address: "" };
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: defaults(),
  });

  async function onSubmit(values: SupplierForm) {
    if (supplier) {
      await updateSupplier.mutateAsync({
        id: supplier.id,
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        active: supplier.active,
      });
    } else {
      await createSupplier.mutateAsync({ name: values.name, phone: values.phone || undefined });
    }
    reset(defaults());
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(defaults());
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "Add supplier"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Name</Label>
            <Input id="supplier-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Phone (optional)</Label>
              <Input id="supplier-phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email (optional)</Label>
              <Input id="supplier-email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-address">Address (optional)</Label>
            <Input id="supplier-address" {...register("address")} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : supplier ? "Save changes" : "Create supplier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers();
  const updateSupplier = useUpdateSupplier();

  function toggleActive(supplier: SupplierResponse) {
    updateSupplier.mutate({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone ?? undefined,
      email: supplier.email ?? undefined,
      address: supplier.address ?? undefined,
      active: !supplier.active,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Suppliers</CardTitle>
        <SupplierFormDialog trigger={<Button>Add supplier</Button>} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
            {suppliers?.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.phone ?? "—"}</TableCell>
                <TableCell>{supplier.email ?? "—"}</TableCell>
                <TableCell>{supplier.address ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={supplier.active ? "default" : "secondary"}>
                    {supplier.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <SupplierFormDialog
                    supplier={supplier}
                    trigger={
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => toggleActive(supplier)}>
                    {supplier.active ? "Deactivate" : "Activate"}
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
