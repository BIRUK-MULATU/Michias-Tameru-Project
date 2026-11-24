package com.michias.threadims.supplier.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 30) String phone,
        @Email @Size(max = 160) String email,
        @Size(max = 255) String address,
        Boolean active) {
}
