package com.michias.threadims.sale.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemResponse(
        UUID id,
        UUID productVariantId,
        String productName,
        String sku,
        String colorName,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal discountAmount,
        BigDecimal lineTotal,
        BigDecimal unitCostAtSale) {
}
