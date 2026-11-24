package com.michias.threadims.closing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record ClosingCountedItem(
        @NotNull UUID productVariantId, @NotNull @DecimalMin(value = "0") BigDecimal countedQty) {
}
