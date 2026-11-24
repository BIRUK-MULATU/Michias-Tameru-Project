package com.michias.threadims.location.dto;

import com.michias.threadims.location.LocationType;
import java.util.UUID;

public record LocationResponse(
        UUID id, String name, LocationType type, String address, boolean active) {
}
