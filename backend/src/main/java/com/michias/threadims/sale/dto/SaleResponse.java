package com.michias.threadims.sale.dto;

import com.michias.threadims.payment.dto.PaymentResponse;
import com.michias.threadims.sale.SaleStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SaleResponse(
        UUID id,
        String saleNumber,
        UUID locationId,
        String locationName,
        UUID customerId,
        String customerName,
        UUID salespersonUserId,
        Instant saleDate,
        SaleStatus status,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        UUID reversedBy,
        Instant reversedAt,
        List<SaleItemResponse> items,
        List<PaymentResponse> payments) {
}
