package com.michias.threadims.user;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.location.Location;
import com.michias.threadims.location.LocationRepository;
import com.michias.threadims.user.dto.UserCreateRequest;
import com.michias.threadims.user.dto.UserResponse;
import com.michias.threadims.user.dto.UserUpdateRequest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserLocationAssignmentRepository assignmentRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            UserLocationAssignmentRepository assignmentRepository,
            LocationRepository locationRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.locationRepository = locationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return userRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found: " + id));
    }

    @Transactional(readOnly = true)
    public UserResponse getResponseById(UUID id) {
        return toResponse(getById(id));
    }

    public UserResponse create(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already taken: " + request.username());
        }
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setRole(request.role());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setActive(true);
        user = userRepository.save(user);

        if (request.locationId() != null) {
            assignLocation(user, request.locationId());
        }
        return toResponse(user);
    }

    public UserResponse update(UUID id, UserUpdateRequest request) {
        User user = getById(id);
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        userRepository.save(user);

        if (request.locationId() != null) {
            assignLocation(user, request.locationId());
        }
        return toResponse(user);
    }

    public UserResponse setActive(UUID id, boolean active) {
        User user = getById(id);
        user.setActive(active);
        userRepository.save(user);
        return toResponse(user);
    }

    public void recordLogin(User user) {
        Instant now = Instant.now();
        user.setLastLoginAt(now);
        user.setLastActivityAt(now);
        userRepository.save(user);
    }

    private void assignLocation(User user, UUID locationId) {
        Location location = locationRepository
                .findById(locationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found: " + locationId));

        assignmentRepository
                .findByUserIdAndUnassignedAtIsNull(user.getId())
                .ifPresent(existing -> {
                    existing.setUnassignedAt(Instant.now());
                    assignmentRepository.save(existing);
                });

        UserLocationAssignment assignment = new UserLocationAssignment();
        assignment.setUser(user);
        assignment.setLocation(location);
        assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public Optional<Location> findActiveLocation(UUID userId) {
        return assignmentRepository
                .findByUserIdAndUnassignedAtIsNull(userId)
                .map(UserLocationAssignment::getLocation);
    }

    private UserResponse toResponse(User user) {
        Location location = findActiveLocation(user.getId()).orElse(null);
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.getLastLoginAt(),
                user.getLastActivityAt(),
                location != null ? location.getId() : null,
                location != null ? location.getName() : null);
    }
}
