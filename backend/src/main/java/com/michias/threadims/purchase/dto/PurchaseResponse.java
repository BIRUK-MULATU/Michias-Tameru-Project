package com.michias.threadims.purchase.dto;

import com.michias.threadims.purchase.PurchaseStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PurchaseResponse(
        UUID id,
        UUID supplierId,
        String supplierName,
        UUID locationId,
        String locationName,
        Instant purchaseDate,
        PurchaseStatus status,
        BigDecimal totalAmount,
        UUID createdBy,
        UUID receivedBy,
        Instant receivedAt,
        List<PurchaseItemResponse> items) {
}
