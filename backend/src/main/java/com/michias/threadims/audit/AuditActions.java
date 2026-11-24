package com.michias.threadims.audit;

/**
 * Action-type/module string constants, added incrementally as each phase
 * wires up its own audit events (see PRD section 15.4 for the full target
 * taxonomy). Kept as plain strings rather than an enum so new modules don't
 * require editing a shared file.
 */
public final class AuditActions {

    public static final String MODULE_AUTH = "AUTH";
    public static final String MODULE_USER = "USER";
    public static final String MODULE_PRODUCT = "PRODUCT";
    public static final String MODULE_INVENTORY = "INVENTORY";
    public static final String MODULE_TRANSFER = "TRANSFER";
    public static final String MODULE_SALE = "SALE";
    public static final String MODULE_PURCHASE = "PURCHASE";
    public static final String MODULE_RETURN = "RETURN";
    public static final String MODULE_EXPENSE = "EXPENSE";
    public static final String MODULE_CLOSING = "CLOSING";

    public static final String LOGIN = "LOGIN";
    public static final String LOGIN_FAILED = "LOGIN_FAILED";
    public static final String LOGOUT = "LOGOUT";
    public static final String USER_CREATED = "USER_CREATED";
    public static final String USER_STATUS_CHANGED = "USER_STATUS_CHANGED";
    public static final String PRODUCT_CREATED = "PRODUCT_CREATED";
    public static final String PRODUCT_UPDATED = "PRODUCT_UPDATED";
    public static final String PRODUCT_VARIANT_CREATED = "PRODUCT_VARIANT_CREATED";
    public static final String PRODUCT_VARIANT_UPDATED = "PRODUCT_VARIANT_UPDATED";
    public static final String STOCK_ADJUSTMENT_REQUESTED = "STOCK_ADJUSTMENT_REQUESTED";
    public static final String STOCK_ADJUSTMENT_APPROVED = "STOCK_ADJUSTMENT_APPROVED";
    public static final String STOCK_ADJUSTMENT_REJECTED = "STOCK_ADJUSTMENT_REJECTED";
    public static final String TRANSFER_CREATED = "TRANSFER_CREATED";
    public static final String TRANSFER_DISPATCHED = "TRANSFER_DISPATCHED";
    public static final String TRANSFER_RECEIVED = "TRANSFER_RECEIVED";
    public static final String TRANSFER_CLOSED = "TRANSFER_CLOSED";
    public static final String TRANSFER_CANCELLED = "TRANSFER_CANCELLED";
    public static final String SALE_COMPLETED = "SALE_COMPLETED";
    public static final String SALE_REVERSED = "SALE_REVERSED";
    public static final String PURCHASE_CREATED = "PURCHASE_CREATED";
    public static final String PURCHASE_RECEIVED = "PURCHASE_RECEIVED";
    public static final String PURCHASE_CANCELLED = "PURCHASE_CANCELLED";
    public static final String RETURN_REQUESTED = "RETURN_REQUESTED";
    public static final String RETURN_APPROVED = "RETURN_APPROVED";
    public static final String RETURN_REJECTED = "RETURN_REJECTED";
    public static final String EXPENSE_CREATED = "EXPENSE_CREATED";
    public static final String EXPENSE_UPDATED = "EXPENSE_UPDATED";
    public static final String CLOSING_SUBMITTED = "CLOSING_SUBMITTED";
    public static final String CLOSING_REVIEWED = "CLOSING_REVIEWED";

    private AuditActions() {}
}
