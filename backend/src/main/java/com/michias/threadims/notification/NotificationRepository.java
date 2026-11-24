package com.michias.threadims.notification;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query(
            "select n from Notification n where n.recipientUserId is null or n.recipientUserId = :userId"
                    + " order by n.createdAt desc")
    List<Notification> findForAdmin(@Param("userId") UUID userId);

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientUserId);
}
