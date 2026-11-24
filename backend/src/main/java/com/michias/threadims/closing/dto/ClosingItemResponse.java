package com.michias.threadims.closing.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ClosingItemResponse(
        UUID productVariantId,
        String productName,
        String sku,
        String colorName,
        BigDecimal openingQty,
        BigDecimal receivedQty,
        BigDecimal soldQty,
        BigDecimal sellableReturnQty,
        BigDecimal approvedAdjustmentQty,
        BigDecimal expectedQty,
        BigDecimal countedQty,
        BigDecimal discrepancyQty) {
}
