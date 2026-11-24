package com.michias.threadims.audit;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Always runs in its own transaction, committed independently of the
     * caller's transaction, so a rolled-back business operation (e.g. a
     * failed sale) still leaves a record of the attempt.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            UUID userId,
            String username,
            String userRole,
            String actionType,
            String module,
            String description,
            String entityType,
            UUID entityId,
            String ipAddress,
            boolean success) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setUsername(username);
        log.setUserRole(userRole);
        log.setActionType(actionType);
        log.setModule(module);
        log.setDescription(description);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setIpAddress(ipAddress);
        log.setSuccess(success);
        auditLogRepository.save(log);
    }
}
