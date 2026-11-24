package com.michias.threadims.location.dto;

import com.michias.threadims.location.LocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LocationRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull LocationType type,
        @Size(max = 255) String address,
        Boolean active) {
}
