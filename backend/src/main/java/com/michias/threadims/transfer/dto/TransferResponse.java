package com.michias.threadims.transfer.dto;

import com.michias.threadims.transfer.TransferStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TransferResponse(
        UUID id,
        UUID fromLocationId,
        String fromLocationName,
        UUID toLocationId,
        String toLocationName,
        TransferStatus status,
        UUID createdBy,
        UUID dispatchedBy,
        Instant dispatchedAt,
        UUID receivedBy,
        Instant receivedAt,
        Instant createdAt,
        List<TransferItemResponse> items) {
}
