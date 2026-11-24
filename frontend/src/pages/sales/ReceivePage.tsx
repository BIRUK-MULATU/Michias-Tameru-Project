import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCloseTransfer, useReceiveTransfer, useTransfers } from "@/features/transfers/api";
import { useAuthStore } from "@/stores/auth-store";
import type { TransferResponse } from "@/types/transfer";

function ReceiveCard({ transfer }: { transfer: TransferResponse }) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const receiveTransfer = useReceiveTransfer();
  const closeTransfer = useCloseTransfer();

  async function handleReceive() {
    const items = transfer.items
      .map((item) => ({
        transferItemId: item.id,
        quantityReceived: Number(quantities[item.id] ?? 0),
      }))
      .filter((item) => item.quantityReceived > 0);
    if (items.length === 0) return;
    await receiveTransfer.mutateAsync({ id: transfer.id, items });
    setQuantities({});
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">From {transfer.fromLocationName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transfer.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {item.productName} — {item.colorName}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.quantityReceived}/{item.quantityDispatched} received
              </p>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={item.outstandingQuantity}
              placeholder={item.outstandingQuantity > 0 ? String(item.outstandingQuantity) : "0"}
              disabled={item.outstandingQuantity <= 0}
              value={quantities[item.id] ?? ""}
              onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))}
              className="h-11 w-24 text-center"
            />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button className="h-11 flex-1" onClick={handleReceive} disabled={receiveTransfer.isPending}>
            Receive entered
          </Button>
          <Button
            className="h-11"
            variant="outline"
            onClick={() => closeTransfer.mutate({ id: transfer.id })}
            disabled={closeTransfer.isPending}
          >
            Close transfer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReceivePage() {
  const user = useAuthStore((state) => state.user);
  const { data: transfers, isLoading } = useTransfers({ locationId: user?.locationId ?? undefined });
  const pending = transfers?.filter(
    (t) => t.status === "DISPATCHED" || t.status === "PARTIALLY_RECEIVED",
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!pending || pending.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No incoming transfers right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pending.map((transfer) => (
        <ReceiveCard key={transfer.id} transfer={transfer} />
      ))}
    </div>
  );
}
