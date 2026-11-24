package com.michias.threadims.report.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EmployeeSummaryResponse(
        UUID id,
        String username,
        String fullName,
        UUID locationId,
        String locationName,
        boolean active,
        Instant lastLoginAt,
        Instant lastActivityAt,
        Instant lastActivityLogAt,
        BigDecimal totalReceivedQty,
        BigDecimal totalSoldQty,
        BigDecimal totalReturnedQty,
        BigDecimal currentLocationStockQty,
        BigDecimal totalRevenue,
        long totalTransactions,
        long pendingReturnRequests,
        long pendingAdjustmentRequests) {
}
