package com.michias.threadims.notification;

/**
 * Plain string constants rather than an enum, so a new module can raise a
 * new notification type without editing a shared file.
 */
public final class NotificationTypes {

    public static final String STOCK_ADJUSTMENT_REQUESTED = "STOCK_ADJUSTMENT_REQUESTED";
    public static final String RETURN_REQUESTED = "RETURN_REQUESTED";
    public static final String TRANSFER_DISCREPANCY = "TRANSFER_DISCREPANCY";
    public static final String CLOSING_DISCREPANCY = "CLOSING_DISCREPANCY";
    public static final String LOW_STOCK = "LOW_STOCK";

    private NotificationTypes() {}
}
