package com.michias.threadims.location;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.location.dto.LocationRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<Location> findAll() {
        return locationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Location getById(UUID id) {
        return locationRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found: " + id));
    }

    public Location create(LocationRequest request) {
        Location location = new Location();
        applyRequest(location, request);
        return locationRepository.save(location);
    }

    public Location update(UUID id, LocationRequest request) {
        Location location = getById(id);
        applyRequest(location, request);
        return locationRepository.save(location);
    }

    private void applyRequest(Location location, LocationRequest request) {
        location.setName(request.name());
        location.setType(request.type());
        location.setAddress(request.address());
        if (request.active() != null) {
            location.setActive(request.active());
        }
    }
}
