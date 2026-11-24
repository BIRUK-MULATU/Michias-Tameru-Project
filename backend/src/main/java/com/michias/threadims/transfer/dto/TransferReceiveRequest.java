package com.michias.threadims.transfer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record TransferReceiveRequest(@NotEmpty @Valid List<TransferReceiveItemRequest> items) {
}
