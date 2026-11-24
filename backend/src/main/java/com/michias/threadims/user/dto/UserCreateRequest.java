package com.michias.threadims.user.dto;

import com.michias.threadims.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UserCreateRequest(
        @NotBlank @Size(max = 60) String username,
        @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 160) String fullName,
        @NotNull Role role,
        UUID locationId) {
}
