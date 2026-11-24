package com.michias.threadims.transfer.dto;

import java.util.List;

public record TransferCloseRequest(List<TransferCloseItemNote> items) {
}
