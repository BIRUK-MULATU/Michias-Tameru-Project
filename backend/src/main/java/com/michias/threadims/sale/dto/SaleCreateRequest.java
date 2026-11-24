package com.michias.threadims.sale.dto;

import com.michias.threadims.payment.dto.PaymentRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record SaleCreateRequest(
        UUID locationId,
        UUID customerId,
        @NotEmpty @Valid List<SaleItemRequest> items,
        @NotEmpty @Valid List<PaymentRequest> payments) {
}
