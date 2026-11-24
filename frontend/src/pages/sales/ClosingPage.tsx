import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClosingPreview, useClosings, useSubmitClosing } from "@/features/closings/api";

export function ClosingPage() {
  const { data: preview, isLoading } = useClosingPreview();
  const { data: pastClosings } = useClosings();
  const submitClosing = useSubmitClosing();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!preview) return;
    const items = preview.items.map((item) => ({
      productVariantId: item.productVariantId,
      countedQty: Number(counts[item.productVariantId] ?? item.expectedQty),
    }));
    try {
      await submitClosing.mutateAsync({ items });
      setSubmitted(true);
      setCounts({});
    } catch {
      toast.error("Could not submit the closing.");
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-medium">Daily closing submitted.</p>
          <Button className="mt-4 h-11" onClick={() => setSubmitted(false)}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Count physical stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {preview?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No stock history at this location yet.</p>
          )}
          {preview?.items.map((item) => (
            <div key={item.productVariantId} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.productName} — {item.colorName}
                </p>
                <p className="text-xs text-muted-foreground">expected {item.expectedQty}</p>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={String(item.expectedQty)}
                className="h-11 w-24 text-center"
                value={counts[item.productVariantId] ?? ""}
                onChange={(e) =>
                  setCounts((prev) => ({ ...prev, [item.productVariantId]: e.target.value }))
                }
              />
            </div>
          ))}
          {preview && preview.items.length > 0 && (
            <Button className="h-12 w-full" onClick={submit} disabled={submitClosing.isPending}>
              {submitClosing.isPending ? "Submitting..." : "Submit closing"}
            </Button>
          )}
        </CardContent>
      </Card>

      {pastClosings && pastClosings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Past closings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastClosings.map((closing) => (
              <div key={closing.id} className="flex items-center justify-between text-sm">
                <span>{new Date(closing.periodEnd).toLocaleDateString()}</span>
                <Badge variant={closing.status === "REVIEWED" ? "default" : "secondary"}>
                  {closing.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
