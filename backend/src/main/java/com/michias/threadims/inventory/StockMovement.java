package com.michias.threadims.inventory;

import com.michias.threadims.common.entity.BaseEntity;
import com.michias.threadims.location.Location;
import com.michias.threadims.product.ProductVariant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Immutable: no service in this codebase may update or delete a row here.
 * Every stock-affecting operation across every module inserts one of these.
 */
@Getter
@Setter
@Entity
@Table(name = "stock_movements")
public class StockMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private StockMovementType movementType;

    @Column(name = "quantity_delta", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityDelta;

    @Column(name = "unit_cost", precision = 14, scale = 4)
    private BigDecimal unitCost;

    @Column(name = "reference_type", length = 40)
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "performed_by_user_id")
    private UUID performedByUserId;

    @Column(length = 500)
    private String note;
}
