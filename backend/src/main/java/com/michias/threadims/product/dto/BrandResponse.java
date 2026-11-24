package com.michias.threadims.product.dto;

import java.util.UUID;

public record BrandResponse(UUID id, String name, boolean active) {
}
