package com.michias.threadims.report.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record SalesReportResponse(
        BigDecimal totalRevenue,
        long totalTransactions,
        BigDecimal averageTransactionValue,
        Map<String, BigDecimal> revenueByPaymentMethod,
        List<ProductSalesRow> bestSellingProducts) {
}
