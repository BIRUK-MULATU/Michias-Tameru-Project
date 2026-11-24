package com.michias.threadims.expense.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        UUID locationId,
        String locationName,
        String category,
        BigDecimal amount,
        String description,
        Instant expenseDate,
        UUID recordedBy) {
}
