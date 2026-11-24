package com.michias.threadims.closing.dto;

import com.michias.threadims.closing.ClosingStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClosingResponse(
        UUID id,
        UUID locationId,
        String locationName,
        UUID submittedBy,
        Instant periodStart,
        Instant periodEnd,
        ClosingStatus status,
        UUID reviewedBy,
        Instant reviewedAt,
        List<ClosingItemResponse> items) {
}
