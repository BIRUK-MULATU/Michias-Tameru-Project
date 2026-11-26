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
import { useCreateCustomer, useCustomers, useUpdateCustomer } from "@/features/customers/api";
import type { CustomerResponse } from "@/types/customer";

const customerSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

function CustomerFormDialog({
  customer,
  trigger,
}: {
  customer?: CustomerResponse;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  function defaults(): CustomerForm {
    return customer
      ? { name: customer.name, phone: customer.phone ?? "" }
      : { name: "", phone: "" };
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaults(),
  });

  async function onSubmit(values: CustomerForm) {
    if (customer) {
      await updateCustomer.mutateAsync({
        id: customer.id,
        name: values.name,
        phone: values.phone || undefined,
        active: customer.active,
      });
    } else {
      await createCustomer.mutateAsync({ name: values.name, phone: values.phone || undefined });
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
          <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="customer-name">Name</Label>
            <Input id="customer-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone (optional)</Label>
            <Input id="customer-phone" {...register("phone")} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : customer ? "Save changes" : "Create customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const updateCustomer = useUpdateCustomer();

  function toggleActive(customer: CustomerResponse) {
    updateCustomer.mutate({
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? undefined,
      active: !customer.active,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Customers</CardTitle>
        <CustomerFormDialog trigger={<Button>Add customer</Button>} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {customers?.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={customer.active ? "default" : "secondary"}>
                    {customer.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <CustomerFormDialog
                    customer={customer}
                    trigger={
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => toggleActive(customer)}>
                    {customer.active ? "Deactivate" : "Activate"}
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
