package com.michias.threadims.closing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record ClosingSubmitRequest(UUID locationId, @NotEmpty @Valid List<ClosingCountedItem> items) {
}
