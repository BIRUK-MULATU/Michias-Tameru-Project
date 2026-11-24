package com.michias.threadims.returns.dto;

import com.michias.threadims.returns.ReturnCondition;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record ReturnItemRequest(
        @NotNull UUID saleItemId,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal quantity,
        @NotNull ReturnCondition condition) {
}
