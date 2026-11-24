package com.michias.threadims.sale.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemRequest(
        @NotNull UUID productVariantId,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal quantity,
        @DecimalMin(value = "0", inclusive = true) BigDecimal discountAmount) {
}
