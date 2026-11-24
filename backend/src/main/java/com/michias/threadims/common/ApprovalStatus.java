package com.michias.threadims.common;

/**
 * Shared by any workflow that needs admin approval before it takes effect
 * (stock adjustments now; returns and daily-closing reviews reuse this).
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
