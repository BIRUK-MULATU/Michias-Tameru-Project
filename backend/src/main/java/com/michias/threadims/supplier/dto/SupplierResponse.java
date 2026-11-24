package com.michias.threadims.supplier.dto;

import java.util.UUID;

public record SupplierResponse(
        UUID id, String name, String phone, String email, String address, boolean active) {
}
