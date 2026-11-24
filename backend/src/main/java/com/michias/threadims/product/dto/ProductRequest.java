package com.michias.threadims.product.dto;

import com.michias.threadims.product.UnitOfMeasure;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ProductRequest(
        @NotBlank @Size(max = 160) String name,
        UUID brandId,
        UUID categoryId,
        @NotNull UnitOfMeasure unitOfMeasure,
        @Size(max = 500) String description,
        Boolean active) {
}
