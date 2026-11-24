import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmployeeComparison, useEmployees } from "@/features/employees/api";

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

export function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees();
  const { data: comparison } = useEmployeeComparison();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Salesperson Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Current stock</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Pending</TableHead>
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
              {employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Link to={`/admin/monitoring/${employee.id}`} className="font-medium hover:underline">
                      {employee.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{employee.username}</p>
                  </TableCell>
                  <TableCell>{employee.locationName ?? "Unassigned"}</TableCell>
                  <TableCell className="text-sm">{formatDate(employee.lastLoginAt)}</TableCell>
                  <TableCell>{employee.currentLocationStockQty}</TableCell>
                  <TableCell>{employee.totalRevenue.toFixed(2)}</TableCell>
                  <TableCell>
                    {employee.pendingReturnRequests + employee.pendingAdjustmentRequests > 0 ? (
                      <Badge variant="destructive">
                        {employee.pendingReturnRequests + employee.pendingAdjustmentRequests}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Qty sold</TableHead>
                <TableHead>Avg. transaction</TableHead>
                <TableHead>Discrepancies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison?.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.totalRevenue.toFixed(2)}</TableCell>
                  <TableCell>{row.totalTransactions}</TableCell>
                  <TableCell>{row.totalQuantitySold}</TableCell>
                  <TableCell>{row.averageTransactionValue.toFixed(2)}</TableCell>
                  <TableCell>
                    {row.stockDiscrepancies > 0 ? (
                      <Badge variant="destructive">{row.stockDiscrepancies}</Badge>
                    ) : (
                      <Badge variant="default">0</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
