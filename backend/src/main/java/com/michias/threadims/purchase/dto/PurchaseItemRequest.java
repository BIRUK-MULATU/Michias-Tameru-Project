package com.michias.threadims.purchase.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseItemRequest(
        @NotNull UUID productVariantId,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal quantity,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal unitCost) {
}
