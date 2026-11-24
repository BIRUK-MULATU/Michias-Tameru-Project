package com.michias.threadims.payment.dto;

import com.michias.threadims.payment.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
        UUID id, PaymentMethod method, BigDecimal amount, String referenceNo, Instant paidAt) {
}
