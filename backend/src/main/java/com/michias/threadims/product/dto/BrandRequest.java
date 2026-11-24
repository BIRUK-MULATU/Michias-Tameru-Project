package com.michias.threadims.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandRequest(@NotBlank @Size(max = 120) String name, Boolean active) {
}
