package com.michias.threadims.transfer.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferItemResponse(
        UUID id,
        UUID productVariantId,
        String productName,
        String sku,
        String colorName,
        BigDecimal quantityDispatched,
        BigDecimal quantityReceived,
        BigDecimal outstandingQuantity,
        BigDecimal unitCostAtDispatch,
        String discrepancyNote) {
}
