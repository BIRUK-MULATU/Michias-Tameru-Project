package com.michias.threadims.audit;

import com.michias.threadims.audit.dto.AuditLogResponse;
import com.michias.threadims.common.DateRanges;
import com.michias.threadims.common.exception.ApiException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read-only access to the audit trail. Deliberately has no update/delete
 * methods — {@link AuditService} only ever inserts, and that invariant
 * extends here too.
 */
@Service
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Page<AuditLogResponse> search(
            UUID userId,
            String username,
            String module,
            String actionType,
            Boolean success,
            Instant from,
            Instant to,
            Pageable pageable) {
        return auditLogRepository
                .search(
                        userId,
                        username == null ? "" : username,
                        module,
                        actionType,
                        success,
                        DateRanges.orPast(from),
                        DateRanges.orFuture(to),
                        pageable)
                .map(this::toResponse);
    }

    public AuditLogResponse getById(UUID id) {
        return auditLogRepository
                .findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Activity log entry not found: " + id));
    }

    public Instant findLastActivity(UUID userId) {
        return auditLogRepository
                .findFirstByUserIdOrderByCreatedAtDesc(userId)
                .map(AuditLog::getCreatedAt)
                .orElse(null);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUserId(),
                log.getUsername(),
                log.getUserRole(),
                log.getActionType(),
                log.getModule(),
                log.getDescription(),
                log.getEntityType(),
                log.getEntityId(),
                log.getIpAddress(),
                log.isSuccess(),
                log.getCreatedAt());
    }
}
