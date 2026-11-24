package com.michias.threadims.common;

import java.time.Instant;

/**
 * Sentinel "unbounded" endpoints for optional date-range query parameters.
 * Query methods take a concrete, non-null {@link Instant} range rather than
 * nullable bounds — PostgreSQL cannot infer a type for a bare null Instant
 * parameter used only in an "is null" check and throws "could not determine
 * data type of parameter". Substituting these sentinels instead of passing
 * null sidesteps that at the root.
 */
public final class DateRanges {

    public static final Instant FAR_PAST = Instant.parse("1970-01-01T00:00:00Z");
    public static final Instant FAR_FUTURE = Instant.parse("2999-12-31T23:59:59Z");

    public static Instant orPast(Instant from) {
        return from != null ? from : FAR_PAST;
    }

    public static Instant orFuture(Instant to) {
        return to != null ? to : FAR_FUTURE;
    }

    private DateRanges() {}
}
