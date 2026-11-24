package com.michias.threadims.audit;

import com.michias.threadims.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Insert-only: no service in this codebase may update or delete a row here.
 */
@Getter
@Setter
@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {

    @Column(name = "user_id")
    private UUID userId;

    @Column(length = 60)
    private String username;

    @Column(name = "user_role", length = 20)
    private String userRole;

    @Column(name = "action_type", nullable = false, length = 60)
    private String actionType;

    @Column(nullable = false, length = 60)
    private String module;

    @Column(length = 500)
    private String description;

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(nullable = false)
    private boolean success = true;
}
