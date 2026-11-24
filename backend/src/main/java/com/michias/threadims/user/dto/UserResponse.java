package com.michias.threadims.user.dto;

import com.michias.threadims.user.Role;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        String fullName,
        Role role,
        boolean active,
        Instant lastLoginAt,
        Instant lastActivityAt,
        UUID locationId,
        String locationName) {
}
