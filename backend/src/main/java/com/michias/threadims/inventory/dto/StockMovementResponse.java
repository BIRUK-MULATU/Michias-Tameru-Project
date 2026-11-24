package com.michias.threadims.inventory.dto;

import com.michias.threadims.inventory.StockMovementType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StockMovementResponse(
        UUID id,
        UUID locationId,
        String locationName,
        UUID productVariantId,
        String productName,
        String sku,
        StockMovementType movementType,
        BigDecimal quantityDelta,
        BigDecimal unitCost,
        String referenceType,
        UUID referenceId,
        UUID performedByUserId,
        String note,
        Instant createdAt) {
}
