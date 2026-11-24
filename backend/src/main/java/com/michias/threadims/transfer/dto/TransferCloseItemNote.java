package com.michias.threadims.transfer.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TransferCloseItemNote(@NotNull UUID transferItemId, String discrepancyNote) {
}
