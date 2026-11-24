package com.michias.threadims.transfer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record TransferReceiveItemRequest(
        @NotNull UUID transferItemId,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal quantityReceived) {
}
