package com.michias.threadims.inventory.dto;

import com.michias.threadims.common.ApprovalStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StockAdjustmentResponse(
        UUID id,
        UUID locationId,
        String locationName,
        UUID productVariantId,
        String productName,
        String sku,
        BigDecimal quantityDelta,
        String reason,
        UUID requestedBy,
        ApprovalStatus status,
        UUID approvedBy,
        Instant approvedAt,
        Instant createdAt) {
}
