package com.michias.threadims.transfer;

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
@Table(name = "stock_transfer_items")
public class StockTransferItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transfer_id", nullable = false)
    private StockTransfer transfer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @Column(name = "quantity_dispatched", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityDispatched;

    @Column(name = "quantity_received", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityReceived = BigDecimal.ZERO;

    @Column(name = "unit_cost_at_dispatch", precision = 14, scale = 4)
    private BigDecimal unitCostAtDispatch;

    @Column(name = "discrepancy_note", length = 500)
    private String discrepancyNote;

    public BigDecimal outstandingQuantity() {
        return quantityDispatched.subtract(quantityReceived);
    }
}
