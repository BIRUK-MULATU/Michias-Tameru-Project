package com.michias.threadims.inventory;

import com.michias.threadims.common.entity.BaseEntity;
import com.michias.threadims.location.Location;
import com.michias.threadims.product.ProductVariant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

/**
 * A transactionally-maintained projection of {@link StockMovement} history,
 * never the source of truth on its own — every change here happens in the
 * same transaction as the ledger row that caused it.
 */
@Getter
@Setter
@Entity
@Table(name = "inventory_balances")
public class InventoryBalance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "average_unit_cost", nullable = false, precision = 14, scale = 4)
    private BigDecimal averageUnitCost = BigDecimal.ZERO;
}
