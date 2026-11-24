package com.michias.threadims.report.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record EmployeeComparisonRow(
        UUID userId,
        String username,
        String fullName,
        String locationName,
        BigDecimal totalRevenue,
        long totalTransactions,
        BigDecimal totalQuantitySold,
        BigDecimal averageTransactionValue,
        long pendingReturnRequests,
        long stockDiscrepancies) {
}
