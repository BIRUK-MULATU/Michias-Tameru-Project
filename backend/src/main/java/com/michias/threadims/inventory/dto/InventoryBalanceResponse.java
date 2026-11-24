package com.michias.threadims.inventory.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InventoryBalanceResponse(
        UUID locationId,
        String locationName,
        UUID productVariantId,
        String productName,
        String sku,
        String colorName,
        BigDecimal quantity,
        BigDecimal averageUnitCost,
        BigDecimal reorderLevel,
        boolean belowReorderLevel) {
}
