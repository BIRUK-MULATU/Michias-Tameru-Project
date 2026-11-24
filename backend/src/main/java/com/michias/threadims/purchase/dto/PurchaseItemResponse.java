package com.michias.threadims.purchase.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseItemResponse(
        UUID id,
        UUID productVariantId,
        String productName,
        String sku,
        String colorName,
        BigDecimal quantity,
        BigDecimal unitCost,
        BigDecimal lineTotal) {
}
