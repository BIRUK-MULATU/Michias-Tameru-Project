package com.michias.threadims.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserLocationAssignmentRepository extends JpaRepository<UserLocationAssignment, UUID> {

    Optional<UserLocationAssignment> findByUserIdAndUnassignedAtIsNull(UUID userId);
}
