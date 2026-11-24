import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadActivityLogExport, useAuditLogs } from "@/features/auditLogs/api";

export function ActivityLogsPage() {
  const [username, setUsername] = useState("");
  const [module, setModule] = useState("");
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAuditLogs({
    username: username || undefined,
    module: module || undefined,
    page,
    size: 25,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Activity Logs</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setPage(0);
            }}
            className="w-48"
          />
          <Input
            placeholder="Module (e.g. SALE)"
            value={module}
            onChange={(e) => {
              setModule(e.target.value.toUpperCase());
              setPage(0);
            }}
            className="w-40"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadActivityLogExport({ username: username || undefined, module: module || undefined }, "csv")}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadActivityLogExport({ username: username || undefined, module: module || undefined }, "xlsx")}
          >
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
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
            {data?.content.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>{log.username ?? "—"}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>{log.actionType}</TableCell>
                <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                  {log.description ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={log.success ? "default" : "destructive"}>
                    {log.success ? "OK" : "Failed"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page + 1} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
