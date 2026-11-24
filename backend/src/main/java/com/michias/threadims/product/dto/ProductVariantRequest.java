package com.michias.threadims.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductVariantRequest(
        @NotBlank @Size(max = 60) String sku,
        @NotBlank @Size(max = 80) String colorName,
        @Size(max = 40) String shadeCode,
        @NotNull @DecimalMin(value = "0", inclusive = true) BigDecimal defaultSalePrice,
        @DecimalMin(value = "0", inclusive = true) BigDecimal reorderLevel,
        Boolean active) {
}
