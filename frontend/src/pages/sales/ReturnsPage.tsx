import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { useSales } from "@/features/sales/api";
import { useCreateReturn, useReturns } from "@/features/returns/api";
import type { ReturnCondition } from "@/types/returns";

export function ReturnsPage() {
  const { data: sales } = useSales();
  const { data: returns } = useReturns();
  const createReturn = useCreateReturn();
  const [saleId, setSaleId] = useState<string>("");
  const [lines, setLines] = useState<Record<string, { quantity: string; condition: ReturnCondition }>>({});

  const sale = sales?.find((s) => s.id === saleId);

  async function submit() {
    if (!sale) return;
    const items = sale.items
      .map((item) => {
        const line = lines[item.id];
        const quantity = Number(line?.quantity ?? 0);
        return quantity > 0
          ? { saleItemId: item.id, quantity, condition: line?.condition ?? ("SELLABLE" as ReturnCondition) }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (items.length === 0) return;
    await createReturn.mutateAsync({ saleId: sale.id, items });
    setSaleId("");
    setLines({});
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request a return</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={saleId} onValueChange={setSaleId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select the original sale" />
            </SelectTrigger>
            <SelectContent>
              {sales
                ?.filter((s) => s.status === "COMPLETED")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.saleNumber} — {s.totalAmount.toFixed(2)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {sale?.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.productName} — {item.colorName}
                </p>
                <p className="text-xs text-muted-foreground">sold {item.quantity}</p>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={item.quantity}
                placeholder="0"
                className="h-11 w-16 text-center"
                value={lines[item.id]?.quantity ?? ""}
                onChange={(e) =>
                  setLines((prev) => ({
                    ...prev,
                    [item.id]: {
                      quantity: e.target.value,
                      condition: prev[item.id]?.condition ?? "SELLABLE",
                    },
                  }))
                }
              />
              <Select
                value={lines[item.id]?.condition ?? "SELLABLE"}
                onValueChange={(value) =>
                  setLines((prev) => ({
                    ...prev,
                    [item.id]: { quantity: prev[item.id]?.quantity ?? "", condition: value as ReturnCondition },
                  }))
                }
              >
                <SelectTrigger className="h-11 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELLABLE">Sellable</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}

          {sale && (
            <Button className="h-11 w-full" onClick={submit} disabled={createReturn.isPending}>
              Submit return request
            </Button>
          )}
        </CardContent>
      </Card>

      {returns && returns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My return requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {returns.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.originalSaleNumber}</span>
                <Badge
                  variant={
                    r.status === "APPROVED" ? "default" : r.status === "REJECTED" ? "destructive" : "secondary"
                  }
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
