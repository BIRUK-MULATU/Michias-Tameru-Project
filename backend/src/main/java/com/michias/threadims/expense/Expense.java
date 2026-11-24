package com.michias.threadims.expense;

import com.michias.threadims.common.entity.BaseEntity;
import com.michias.threadims.location.Location;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "expenses")
public class Expense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String description;

    @Column(name = "expense_date", nullable = false)
    private Instant expenseDate = Instant.now();

    @Column(name = "recorded_by", nullable = false)
    private UUID recordedBy;
}
