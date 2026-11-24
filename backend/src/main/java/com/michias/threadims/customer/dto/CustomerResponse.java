package com.michias.threadims.customer.dto;

import java.util.UUID;

public record CustomerResponse(UUID id, String name, String phone, boolean active) {
}
