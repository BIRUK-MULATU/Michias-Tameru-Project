package com.michias.threadims.notification;

import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.notification.dto.NotificationResponse;
import com.michias.threadims.security.UserPrincipal;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<NotificationResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(notificationService.findForPrincipal(principal));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(notificationService.markRead(id, principal));
    }
}
