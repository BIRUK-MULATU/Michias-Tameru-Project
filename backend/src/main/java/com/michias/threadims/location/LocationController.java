package com.michias.threadims.location;

import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.location.dto.LocationRequest;
import com.michias.threadims.location.dto.LocationResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;
    private final LocationMapper locationMapper;

    public LocationController(LocationService locationService, LocationMapper locationMapper) {
        this.locationService = locationService;
        this.locationMapper = locationMapper;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<LocationResponse>> list() {
        List<LocationResponse> locations =
                locationService.findAll().stream().map(locationMapper::toResponse).toList();
        return ApiResponse.ok(locations);
    }

    @GetMapping("/{id}")
    public ApiResponse<LocationResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(locationMapper.toResponse(locationService.getById(id)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<LocationResponse> create(@Valid @RequestBody LocationRequest request) {
        return ApiResponse.ok(locationMapper.toResponse(locationService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<LocationResponse> update(
            @PathVariable UUID id, @Valid @RequestBody LocationRequest request) {
        return ApiResponse.ok(locationMapper.toResponse(locationService.update(id, request)));
    }
}
