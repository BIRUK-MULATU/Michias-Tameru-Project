package com.michias.threadims.transfer;

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

@Getter
@Setter
@Entity
@Table(name = "stock_transfers")
public class StockTransfer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_location_id", nullable = false)
    private Location fromLocation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_location_id", nullable = false)
    private Location toLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransferStatus status = TransferStatus.DRAFT;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "dispatched_by")
    private UUID dispatchedBy;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Column(name = "received_by")
    private UUID receivedBy;

    @Column(name = "received_at")
    private Instant receivedAt;

    @OneToMany(mappedBy = "transfer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt asc")
    private List<StockTransferItem> items = new ArrayList<>();
}
