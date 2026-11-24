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

    public static final String LOGIN = "LOGIN";
    public static final String LOGIN_FAILED = "LOGIN_FAILED";
    public static final String LOGOUT = "LOGOUT";
    public static final String USER_CREATED = "USER_CREATED";
    public static final String USER_STATUS_CHANGED = "USER_STATUS_CHANGED";

    private AuditActions() {}
}
