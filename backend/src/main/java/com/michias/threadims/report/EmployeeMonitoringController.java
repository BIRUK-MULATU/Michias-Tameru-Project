package com.michias.threadims.report;

import com.michias.threadims.audit.dto.AuditLogResponse;
import com.michias.threadims.closing.dto.ClosingPreviewResponse;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.inventory.dto.StockMovementResponse;
import com.michias.threadims.report.dto.EmployeeComparisonRow;
import com.michias.threadims.report.dto.EmployeePerformanceResponse;
import com.michias.threadims.report.dto.EmployeeSummaryResponse;
import com.michias.threadims.sale.dto.SaleResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/employees")
@PreAuthorize("hasRole('ADMIN')")
public class EmployeeMonitoringController {

    private final EmployeeMonitoringService employeeMonitoringService;

    public EmployeeMonitoringController(EmployeeMonitoringService employeeMonitoringService) {
        this.employeeMonitoringService = employeeMonitoringService;
    }

    @GetMapping
    public ApiResponse<List<EmployeeSummaryResponse>> list() {
        return ApiResponse.ok(employeeMonitoringService.findAllSummaries());
    }

    @GetMapping("/performance-comparison")
    public ApiResponse<List<EmployeeComparisonRow>> comparison() {
        return ApiResponse.ok(employeeMonitoringService.getPerformanceComparison());
    }

    @GetMapping("/{id}")
    public ApiResponse<EmployeeSummaryResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(employeeMonitoringService.getSummary(id));
    }

    @GetMapping("/{id}/inventory")
    public ApiResponse<ClosingPreviewResponse> inventory(@PathVariable UUID id) {
        return ApiResponse.ok(employeeMonitoringService.getInventoryAccountability(id));
    }

    @GetMapping("/{id}/sales")
    public ApiResponse<List<SaleResponse>> sales(@PathVariable UUID id) {
        return ApiResponse.ok(employeeMonitoringService.getSalesHistory(id));
    }

    @GetMapping("/{id}/performance")
    public ApiResponse<EmployeePerformanceResponse> performance(
            @PathVariable UUID id,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ApiResponse.ok(employeeMonitoringService.getPerformance(id, from, to));
    }

    @GetMapping("/{id}/stock-movements")
    public ApiResponse<Page<StockMovementResponse>> stockMovements(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ApiResponse.ok(employeeMonitoringService.getStockMovements(id, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}/activities")
    public ApiResponse<Page<AuditLogResponse>> activities(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ApiResponse.ok(employeeMonitoringService.getActivities(id, PageRequest.of(page, size)));
    }
}
