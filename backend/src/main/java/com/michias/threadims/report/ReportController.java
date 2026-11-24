package com.michias.threadims.report;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.inventory.InventoryBalance;
import com.michias.threadims.report.dto.SalesReportResponse;
import com.michias.threadims.sale.Sale;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    public ApiResponse<SalesReportResponse> salesSummary(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ApiResponse.ok(reportService.salesSummary(locationId, from, to));
    }

    @GetMapping("/sales/export")
    public ResponseEntity<byte[]> exportSales(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "csv") String format) {
        List<Sale> sales = reportService.salesRows(locationId, from, to);
        List<String> headers = List.of("Sale #", "Location", "Date", "Subtotal", "Discount", "Total");
        List<List<String>> rows = sales.stream()
                .map(s -> List.of(
                        s.getSaleNumber(),
                        s.getLocation().getName(),
                        String.valueOf(s.getSaleDate()),
                        s.getSubtotal().toPlainString(),
                        s.getDiscountAmount().toPlainString(),
                        s.getTotalAmount().toPlainString()))
                .toList();
        return respond(headers, rows, format, "sales-report");
    }

    @GetMapping("/inventory/export")
    public ResponseEntity<byte[]> exportInventory(
            @RequestParam UUID locationId, @RequestParam(defaultValue = "csv") String format) {
        List<InventoryBalance> balances = reportService.inventoryRows(locationId);
        List<String> headers = List.of("SKU", "Product", "Color", "Quantity", "Avg. Unit Cost");
        List<List<String>> rows = balances.stream()
                .map(b -> List.of(
                        b.getProductVariant().getSku(),
                        b.getProductVariant().getProduct().getName(),
                        b.getProductVariant().getColorName(),
                        b.getQuantity().toPlainString(),
                        b.getAverageUnitCost().toPlainString()))
                .toList();
        return respond(headers, rows, format, "inventory-report");
    }

    private ResponseEntity<byte[]> respond(
            List<String> headers, List<List<String>> rows, String format, String baseName) {
        byte[] content;
        MediaType mediaType;
        String filename;
        if ("xlsx".equalsIgnoreCase(format)) {
            content = ExportWriter.toXlsx(baseName, headers, rows);
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            filename = baseName + ".xlsx";
        } else if ("csv".equalsIgnoreCase(format)) {
            content = ExportWriter.toCsv(headers, rows);
            mediaType = MediaType.parseMediaType("text/csv");
            filename = baseName + ".csv";
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported export format: " + format);
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(content);
    }
}
