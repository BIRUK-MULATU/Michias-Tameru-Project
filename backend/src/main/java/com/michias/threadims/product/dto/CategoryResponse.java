package com.michias.threadims.product.dto;

import java.util.UUID;

public record CategoryResponse(
        UUID id, String name, UUID parentCategoryId, String parentCategoryName, boolean active) {
}
