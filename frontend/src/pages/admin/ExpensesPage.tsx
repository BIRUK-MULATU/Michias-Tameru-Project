import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useCreateExpense, useExpenses } from "@/features/expenses/api";

const expenseSchema = z.object({
  locationId: z.string().optional(),
  category: z.string().min(1, "Required"),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
});

type ExpenseFormInput = z.input<typeof expenseSchema>;
type ExpenseForm = z.output<typeof expenseSchema>;

function CreateExpenseDialog() {
  const [open, setOpen] = useState(false);
  const { data: locations } = useLocations();
  const createExpense = useCreateExpense();

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseForm>({ resolver: zodResolver(expenseSchema) });

  async function onSubmit(values: ExpenseForm) {
    await createExpense.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Record expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record expense</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <Input id="expense-category" placeholder="Rent, utilities, transport..." {...register("category")} />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <Input id="expense-amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Location (optional — leave blank for business-wide)</Label>
            <Select onValueChange={(value) => setValue("locationId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Business-wide" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-description">Description (optional)</Label>
            <Input id="expense-description" {...register("description")} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Record expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expenses</CardTitle>
        <CreateExpenseDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
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
            {expenses?.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.locationName ?? "Business-wide"}</TableCell>
                <TableCell>{expense.amount.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">{expense.description ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
