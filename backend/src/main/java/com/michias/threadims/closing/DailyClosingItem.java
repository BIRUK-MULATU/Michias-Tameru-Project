package com.michias.threadims.closing;

import com.michias.threadims.common.entity.BaseEntity;
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

@Getter
@Setter
@Entity
@Table(name = "daily_closing_items")
public class DailyClosingItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "closing_id", nullable = false)
    private DailyClosing closing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @Column(name = "opening_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal openingQty;

    @Column(name = "received_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal receivedQty;

    @Column(name = "sold_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal soldQty;

    @Column(name = "sellable_return_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal sellableReturnQty;

    @Column(name = "approved_adjustment_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal approvedAdjustmentQty;

    @Column(name = "expected_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal expectedQty;

    @Column(name = "counted_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal countedQty;

    @Column(name = "discrepancy_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal discrepancyQty;
}
