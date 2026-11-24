package com.michias.threadims.returns.dto;

import com.michias.threadims.common.ApprovalStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReturnResponse(
        UUID id,
        UUID originalSaleId,
        String originalSaleNumber,
        UUID locationId,
        String locationName,
        UUID processedBy,
        UUID approvedBy,
        ApprovalStatus status,
        Instant returnDate,
        List<ReturnItemResponse> items) {
}
