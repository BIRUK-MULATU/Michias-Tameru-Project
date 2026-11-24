package com.michias.threadims.closing.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClosingPreviewResponse(
        UUID locationId, String locationName, Instant periodStart, Instant periodEnd, List<ClosingItemPreview> items) {
}
