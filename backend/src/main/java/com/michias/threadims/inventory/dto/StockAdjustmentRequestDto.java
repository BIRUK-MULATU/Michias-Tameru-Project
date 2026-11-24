package com.michias.threadims.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record StockAdjustmentRequestDto(
        @NotNull UUID locationId,
        @NotNull UUID productVariantId,
        @NotNull BigDecimal quantityDelta,
        @NotBlank @Size(max = 500) String reason) {
}
