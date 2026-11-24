package com.michias.threadims.payment.dto;

import com.michias.threadims.payment.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PaymentRequest(
        @NotNull PaymentMethod method,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal amount,
        @Size(max = 100) String referenceNo) {
}
