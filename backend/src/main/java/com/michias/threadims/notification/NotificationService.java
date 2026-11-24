package com.michias.threadims.notification;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.notification.dto.NotificationResponse;
import com.michias.threadims.security.UserPrincipal;
import com.michias.threadims.user.Role;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /** {@code recipientUserId == null} broadcasts to every admin. */
    public void notify(
            UUID recipientUserId, String type, String title, String message, String referenceType, UUID referenceId) {
        Notification notification = new Notification();
        notification.setRecipientUserId(recipientUserId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findForPrincipal(UserPrincipal principal) {
        List<Notification> notifications = principal.getRole() == Role.ADMIN
                ? notificationRepository.findForAdmin(principal.getId())
                : notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(principal.getId());
        return notifications.stream().map(this::toResponse).toList();
    }

    public NotificationResponse markRead(UUID id, UserPrincipal principal) {
        Notification notification = notificationRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found: " + id));
        boolean visible = principal.getRole() == Role.ADMIN
                ? notification.getRecipientUserId() == null || notification.getRecipientUserId().equals(principal.getId())
                : principal.getId().equals(notification.getRecipientUserId());
        if (!visible) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized for this notification");
        }
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}
