import { Minus, Plus, Printer, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomers } from "@/features/customers/api";
import { useInventoryBalances } from "@/features/inventory/api";
import { useProductVariants } from "@/features/products/api";
import { useCreateSale } from "@/features/sales/api";
import { useAuthStore } from "@/stores/auth-store";
import type { PaymentMethod, SaleResponse } from "@/types/sale";

interface CartLine {
  productVariantId: string;
  productName: string;
  colorName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function Receipt({ sale, onNewSale }: { sale: SaleResponse; onNewSale: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sale {sale.saleNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div id="receipt-print" className="space-y-2 text-sm">
          <p className="text-muted-foreground">{sale.locationName}</p>
          <p className="text-muted-foreground">{new Date(sale.saleDate).toLocaleString()}</p>
          {sale.customerName && <p className="text-muted-foreground">Customer: {sale.customerName}</p>}
          <div className="divide-y">
            {sale.items.map((item) => (
              <div key={item.id} className="flex justify-between py-1">
                <span>
                  {item.productName} ({item.colorName}) × {item.quantity}
                </span>
                <span>{item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{sale.totalAmount.toFixed(2)}</span>
          </div>
          <p className="text-muted-foreground">
            Paid via {sale.payments.map((p) => p.method).join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="h-11 flex-1" onClick={onNewSale}>
            New sale
          </Button>
          <Button className="h-11" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SellPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const { data: variants } = useProductVariants(debouncedSearch);
  const { data: balances } = useInventoryBalances(user?.locationId ?? undefined);
  const { data: customers } = useCustomers();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);
  const createSale = useCreateSale();

  const stockByVariant = useMemo(() => {
    const map = new Map<string, number>();
    balances?.forEach((b) => map.set(b.productVariantId, b.quantity));
    return map;
  }, [balances]);

  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  function addToCart(variant: NonNullable<typeof variants>[number]) {
    const available = stockByVariant.get(variant.id) ?? 0;
    setCart((prev) => {
      const existing = prev.find((line) => line.productVariantId === variant.id);
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map((line) =>
          line.productVariantId === variant.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      if (available <= 0) return prev;
      return [
        ...prev,
        {
          productVariantId: variant.id,
          productName: variant.productName,
          colorName: variant.colorName,
          sku: variant.sku,
          unitPrice: variant.defaultSalePrice,
          quantity: 1,
          availableStock: available,
        },
      ];
    });
  }

  function updateQuantity(variantId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.productVariantId === variantId
            ? { ...line, quantity: Math.min(line.availableStock, Math.max(0, line.quantity + delta)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(variantId: string) {
    setCart((prev) => prev.filter((line) => line.productVariantId !== variantId));
  }

  async function completeSale() {
    if (cart.length === 0) return;
    try {
      const sale = await createSale.mutateAsync({
        customerId: customerId || undefined,
        items: cart.map((line) => ({ productVariantId: line.productVariantId, quantity: line.quantity })),
        payments: [{ method: paymentMethod, amount: total }],
      });
      setCompletedSale(sale);
      setCart([]);
      setSearch("");
      setCustomerId("");
    } catch {
      toast.error("Could not complete the sale — check stock and try again.");
    }
  }

  if (completedSale) {
    return <Receipt sale={completedSale} onNewSale={() => setCompletedSale(null)} />;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by product, SKU, or color"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-12 text-base"
      />

      {search && (
        <div className="space-y-2">
          {variants?.length === 0 && (
            <p className="text-sm text-muted-foreground">No matching products.</p>
          )}
          {variants?.map((variant) => {
            const available = stockByVariant.get(variant.id) ?? 0;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => addToCart(variant)}
                disabled={available <= 0}
                className="flex w-full items-center justify-between rounded-md border p-3 text-left disabled:opacity-40"
              >
                <div>
                  <p className="font-medium">
                    {variant.productName} — {variant.colorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {variant.sku} · {available} in stock
                  </p>
                </div>
                <span className="font-semibold">{variant.defaultSalePrice.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      )}

      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.map((line) => (
              <div key={line.productVariantId} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {line.productName} — {line.colorName}
                  </p>
                  <p className="text-xs text-muted-foreground">{line.unitPrice.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={() => updateQuantity(line.productVariantId, -1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center">{line.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    disabled={line.quantity >= line.availableStock}
                    onClick={() => updateQuantity(line.productVariantId, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => removeLine(line.productVariantId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{total.toFixed(2)}</span>
            </div>

            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Walk-in customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile money</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
              </SelectContent>
            </Select>

            <Button className="h-12 w-full text-base" onClick={completeSale} disabled={createSale.isPending}>
              {createSale.isPending ? "Completing..." : `Complete sale — ${total.toFixed(2)}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
