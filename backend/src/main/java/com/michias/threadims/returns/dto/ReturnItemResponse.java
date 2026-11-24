package com.michias.threadims.returns.dto;

import com.michias.threadims.returns.ReturnCondition;
import java.math.BigDecimal;
import java.util.UUID;

public record ReturnItemResponse(
        UUID id,
        UUID saleItemId,
        String productName,
        String sku,
        String colorName,
        BigDecimal quantity,
        ReturnCondition condition) {
}
