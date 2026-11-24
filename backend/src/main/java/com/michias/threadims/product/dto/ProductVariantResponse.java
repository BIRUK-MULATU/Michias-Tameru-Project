package com.michias.threadims.product.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductVariantResponse(
        UUID id,
        UUID productId,
        String productName,
        String brandName,
        String sku,
        String colorName,
        String shadeCode,
        BigDecimal defaultSalePrice,
        BigDecimal reorderLevel,
        boolean active) {
}
