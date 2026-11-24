package com.michias.threadims.transfer;

public enum TransferStatus {
    /** Created but stock not yet deducted at the source. Cancellable. */
    DRAFT,
    /** Source stock deducted; items are in transit awaiting receipt. */
    DISPATCHED,
    /** Some items/quantities received; receiving is still open. */
    PARTIALLY_RECEIVED,
    /** Receiving closed — either fully matched or closed with a recorded discrepancy. */
    RECEIVED,
    CANCELLED
}
