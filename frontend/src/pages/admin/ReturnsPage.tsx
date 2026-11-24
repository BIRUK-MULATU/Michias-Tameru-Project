import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApproveReturn, useRejectReturn, useReturns } from "@/features/returns/api";
import type { ApprovalStatus } from "@/types/returns";

function statusVariant(status: ApprovalStatus): "default" | "secondary" | "destructive" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

export function ReturnsPage() {
  const { data: returns, isLoading } = useReturns();
  const approve = useApproveReturn();
  const reject = useRejectReturn();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Returns</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Items</TableHead>
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
            {returns?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.originalSaleNumber}</TableCell>
                <TableCell>{r.locationName}</TableCell>
                <TableCell>
                  {r.items.map((i) => `${i.productName} (${i.colorName}) x${i.quantity} [${i.condition}]`).join(", ")}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  {r.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => approve.mutate(r.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject.mutate(r.id)}>
                        Reject
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
