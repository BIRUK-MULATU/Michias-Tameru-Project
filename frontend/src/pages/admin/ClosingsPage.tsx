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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClosings, useReviewClosing } from "@/features/closings/api";
import type { ClosingResponse } from "@/types/closing";

function ClosingDetailDialog({ closing }: { closing: ClosingResponse }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{closing.locationName}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Counted</TableHead>
              <TableHead>Discrepancy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closing.items.map((item) => (
              <TableRow key={item.productVariantId}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>{item.expectedQty}</TableCell>
                <TableCell>{item.countedQty}</TableCell>
                <TableCell className={item.discrepancyQty !== 0 ? "text-destructive font-medium" : ""}>
                  {item.discrepancyQty > 0 ? "+" : ""}
                  {item.discrepancyQty}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

export function ClosingsPage() {
  const { data: closings, isLoading } = useClosings();
  const reviewClosing = useReviewClosing();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Closings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Period end</TableHead>
              <TableHead>Discrepancies</TableHead>
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
            {closings?.map((closing) => {
              const discrepancies = closing.items.filter((i) => i.discrepancyQty !== 0).length;
              return (
                <TableRow key={closing.id}>
                  <TableCell>{closing.locationName}</TableCell>
                  <TableCell>{new Date(closing.periodEnd).toLocaleString()}</TableCell>
                  <TableCell>
                    {discrepancies > 0 ? (
                      <Badge variant="destructive">{discrepancies} SKU(s)</Badge>
                    ) : (
                      <Badge variant="default">None</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={closing.status === "REVIEWED" ? "default" : "secondary"}>
                      {closing.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <ClosingDetailDialog closing={closing} />
                    {closing.status === "SUBMITTED" && (
                      <Button size="sm" onClick={() => reviewClosing.mutate(closing.id)}>
                        Mark reviewed
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
