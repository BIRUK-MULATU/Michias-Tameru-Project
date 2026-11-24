package com.michias.threadims.report.dto;

import java.math.BigDecimal;

public record ProductSalesRow(
        String productName, String sku, String colorName, BigDecimal totalQuantity, BigDecimal totalRevenue) {
}
