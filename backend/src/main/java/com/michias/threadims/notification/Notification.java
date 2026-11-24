package com.michias.threadims.notification;

import com.michias.threadims.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * {@code recipientUserId == null} means "broadcast to every admin" — the
 * audience for most operational alerts. A non-null id targets one user,
 * e.g. telling a salesperson their stock request was approved.
 */
@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {

    @Column(name = "recipient_user_id")
    private UUID recipientUserId;

    @Column(nullable = false, length = 60)
    private String type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "reference_type", length = 40)
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;
}
