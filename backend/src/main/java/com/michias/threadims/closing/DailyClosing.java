package com.michias.threadims.closing;

import com.michias.threadims.common.entity.BaseEntity;
import com.michias.threadims.location.Location;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Covers the window from the previous closing's {@code periodEnd} for this
 * location (or the location's creation time, for the first-ever closing) up
 * to {@code periodEnd} — so consecutive closings tile the ledger without
 * gaps or overlaps.
 */
@Getter
@Setter
@Entity
@Table(name = "daily_closings")
public class DailyClosing extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "submitted_by", nullable = false)
    private UUID submittedBy;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClosingStatus status = ClosingStatus.SUBMITTED;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @OneToMany(mappedBy = "closing", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt asc")
    private List<DailyClosingItem> items = new ArrayList<>();
}
