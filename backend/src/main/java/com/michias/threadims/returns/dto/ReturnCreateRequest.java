package com.michias.threadims.returns.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record ReturnCreateRequest(
        @NotNull UUID saleId, @NotEmpty @Valid List<ReturnItemRequest> items) {
}
