package com.michias.threadims.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String message,
        String referenceType,
        UUID referenceId,
        boolean read,
        Instant createdAt) {
}
