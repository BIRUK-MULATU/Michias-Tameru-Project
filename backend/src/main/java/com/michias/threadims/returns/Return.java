package com.michias.threadims.returns;

import com.michias.threadims.common.ApprovalStatus;
import com.michias.threadims.common.entity.BaseEntity;
import com.michias.threadims.sale.Sale;
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
@Table(name = "returns")
public class Return extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "original_sale_id", nullable = false)
    private Sale originalSale;

    @Column(name = "processed_by", nullable = false)
    private UUID processedBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "return_date", nullable = false)
    private Instant returnDate = Instant.now();

    @OneToMany(mappedBy = "returnRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt asc")
    private List<ReturnItem> items = new ArrayList<>();
}
