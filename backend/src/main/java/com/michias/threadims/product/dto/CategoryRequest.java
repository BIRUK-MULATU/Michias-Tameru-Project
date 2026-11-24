package com.michias.threadims.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CategoryRequest(
        @NotBlank @Size(max = 120) String name, UUID parentCategoryId, Boolean active) {
}
