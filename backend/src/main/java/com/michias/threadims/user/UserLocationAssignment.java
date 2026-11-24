package com.michias.threadims.user;

import com.michias.threadims.common.entity.BaseEntity;
import com.michias.threadims.location.Location;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/**
 * One row per assignment; {@code unassignedAt == null} marks the currently
 * active assignment. Kept as a table (not a column on User) to preserve
 * reassignment history.
 */
@Getter
@Setter
@Entity
@Table(name = "user_location_assignments")
public class UserLocationAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt = Instant.now();

    @Column(name = "unassigned_at")
    private Instant unassignedAt;
}
