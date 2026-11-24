package com.michias.threadims.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UserUpdateRequest(
        @Email @Size(max = 160) String email,
        @NotBlank @Size(max = 160) String fullName,
        UUID locationId) {
}
