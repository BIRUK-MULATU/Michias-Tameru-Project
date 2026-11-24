package com.michias.threadims.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank @Size(max = 160) String name, @Size(max = 30) String phone, Boolean active) {
}
