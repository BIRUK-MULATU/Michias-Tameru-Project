package com.michias.threadims.product.dto;

import com.michias.threadims.product.UnitOfMeasure;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        UUID brandId,
        String brandName,
        UUID categoryId,
        String categoryName,
        UnitOfMeasure unitOfMeasure,
        String description,
        boolean active) {
}
