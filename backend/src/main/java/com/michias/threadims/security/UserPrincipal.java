package com.michias.threadims.security;

import com.michias.threadims.user.Role;
import com.michias.threadims.user.User;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String username;
    private final String passwordHash;
    private final Role role;
    private final boolean active;
    private final UUID locationId;

    public UserPrincipal(
            UUID id, String username, String passwordHash, Role role, boolean active, UUID locationId) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
        this.locationId = locationId;
    }

    public static UserPrincipal from(User user, UUID locationId) {
        return new UserPrincipal(
                user.getId(), user.getUsername(), user.getPasswordHash(), user.getRole(), user.isActive(), locationId);
    }

    public UUID getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    /** The salesperson's currently assigned location, or {@code null} for an admin. */
    public UUID getLocationId() {
        return locationId;
    }

    @Override
    public List<GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
