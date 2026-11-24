package com.michias.threadims.security;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.user.Role;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Server-side location scoping for salesperson-facing endpoints: a
 * salesperson's requests are always resolved against their own assigned
 * location, never a location id taken from the request. Callers must never
 * skip this and trust a client-supplied location id for a non-admin caller.
 */
@Component
public class LocationAccessGuard {

    /**
     * @param requestedLocationId the location id a request asked for, or
     *     {@code null} to mean "my own location"
     * @return the location id to actually use. For an admin, this is
     *     {@code requestedLocationId} unchanged (possibly {@code null},
     *     meaning "all locations" where the caller supports that).
     */
    public UUID resolve(UserPrincipal principal, UUID requestedLocationId) {
        if (principal.getRole() == Role.ADMIN) {
            return requestedLocationId;
        }
        if (principal.getLocationId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No location is assigned to this account yet");
        }
        if (requestedLocationId != null && !requestedLocationId.equals(principal.getLocationId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized for that location");
        }
        return principal.getLocationId();
    }
}
