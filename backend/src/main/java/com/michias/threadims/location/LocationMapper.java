package com.michias.threadims.location;

import com.michias.threadims.location.dto.LocationResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LocationMapper {

    LocationResponse toResponse(Location location);
}
