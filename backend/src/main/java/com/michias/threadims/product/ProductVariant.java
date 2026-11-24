package com.michias.threadims.product;

import com.michias.threadims.common.entity.BaseEntity;
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
 * The actual sellable, stockable unit — one row per color/shade of a
 * {@link Product}. SKU lives here, not on Product, since the PRD requires
 * each color code to have its own unique SKU and separate inventory record.
 */
@Getter
@Setter
@Entity
@Table(name = "product_variants")
public class ProductVariant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    @Column(name = "color_name", nullable = false, length = 80)
    private String colorName;

    @Column(name = "shade_code", length = 40)
    private String shadeCode;

    @Column(name = "default_sale_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal defaultSalePrice;

    @Column(name = "reorder_level", nullable = false, precision = 14, scale = 3)
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
