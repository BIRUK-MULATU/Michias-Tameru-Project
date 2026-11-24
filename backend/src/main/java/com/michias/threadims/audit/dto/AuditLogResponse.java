package com.michias.threadims.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID userId,
        String username,
        String userRole,
        String actionType,
        String module,
        String description,
        String entityType,
        UUID entityId,
        String ipAddress,
        boolean success,
        Instant createdAt) {
}
